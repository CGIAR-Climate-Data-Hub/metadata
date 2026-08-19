#!/usr/bin/env node
// Validate CDH input YAML records in two layers:
//   mechanism - core composed with only the extensions each record declares in
//     extensions[]; a field from an extension that was used but not declared
//     is rejected (unevaluatedProperties). Always applied.
//   profile (--profile) - a policy schema with house rules (e.g. the CDH
//     profile requires the cdh extension on every record). Optional; the CDH
//     pipeline passes its own profile exactly like any other adopter would.
//
// Files under templates/ are validated as drafts (blank placeholders pruned,
// presence rules relaxed).
//
// Usage:
//   node scripts/validate-yaml.js                # default: templates/ + examples/
//   node scripts/validate-yaml.js path [path...] # validate the given files or directories
//
// Flags:
//   --profile <schema.json>  also validate every record against this policy
//                            schema (the CDH pipeline passes the CDH profile;
//                            adopters pass their own or omit for mechanism-only)
//   --schemas <file-or-dir>  register additional extension schemas (repeatable),
//                            e.g. a third-party extension a record declares
//   --draft                  validate every target as a fillable draft: prune
//                            blank placeholders and relax presence rules
//   --expect-fail            invert the outcome: every file MUST be invalid;
//                            used for the negative fixtures in tests/invalid/
//
// Directories are walked recursively for *.yaml and *.yml files. Files of any
// other extension are accepted as-is (so explicit non-.yaml paths still work).

import { readdir, readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

import yaml from "js-yaml";
import validateSpdxExpression from "spdx-expression-validate";

import { loadAllSchemas, newAjv, rel, ROOT } from "./_ajv.js";

// Version-tagged $id matches the schema's published gh-pages URL. The version
// comes from package.json so a release bump flows through automatically.
const { version } = JSON.parse(await readFile(resolve(ROOT, "package.json"), "utf-8"));
const BASE = `https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v${version}`;
const CORE_ID = `${BASE}/schemas/core.schema.json`;

// Matches CDH-hosted, version-tagged schema URLs; captures the version segment.
// Records keep the URLs of the release they target, so declared URLs are
// resolved against this checkout's schemas regardless of version.
const CDH_VERSIONED_URL =
  /^(https:\/\/cgiar-climate-data-hub\.github\.io\/cdh-metadata-standard)\/(v\d+\.\d+\.\d+)\//;
const toCurrentVersion = (url) => url.replace(CDH_VERSIONED_URL, `$1/v${version}/`);

const YAML_EXTS = [".yaml", ".yml"];
const list = (v) => (Array.isArray(v) ? v : []);

async function walk(dir, exts) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      out.push(...(await walk(full, exts)));
    } else if (entry.isFile() && exts.includes(extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

async function expand(path) {
  const abs = resolve(process.cwd(), path);
  let st;
  try {
    st = await stat(abs);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`error: path not found: ${path}`);
      process.exit(2);
    }
    throw err;
  }
  return st.isDirectory() ? walk(abs, YAML_EXTS) : [abs];
}

async function defaultTargets() {
  const targets = [];
  for (const name of ["templates", "examples"]) {
    try {
      targets.push(...(await walk(resolve(ROOT, name), YAML_EXTS)));
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }
  return targets;
}

const argPaths = [];
const extraSchemaPaths = [];
let profilePath = null;
let forceDraft = false;
let expectFail = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--schemas") {
    const next = argv[++i];
    if (!next) {
      console.error("error: --schemas requires a file or directory");
      process.exit(2);
    }
    extraSchemaPaths.push(next);
  } else if (argv[i] === "--profile") {
    profilePath = argv[++i];
    if (!profilePath) {
      console.error("error: --profile requires a schema file");
      process.exit(2);
    }
  } else if (argv[i] === "--expect-fail") {
    expectFail = true;
  } else if (argv[i] === "--draft") {
    forceDraft = true;
  } else {
    argPaths.push(argv[i]);
  }
}

const files =
  argPaths.length === 0 ? await defaultTargets() : (await Promise.all(argPaths.map(expand))).flat();

if (files.length === 0) {
  console.error("error: no YAML files to validate");
  process.exit(2);
}

const ajv = newAjv();
const loaded = await loadAllSchemas(ajv);
for (const path of extraSchemaPaths) {
  const abs = resolve(process.cwd(), path);
  const jsonFiles = (await stat(abs)).isDirectory() ? await walk(abs, [".json"]) : [abs];
  for (const file of jsonFiles) {
    const schema = JSON.parse(await readFile(file, "utf-8"));
    ajv.addSchema(schema);
    loaded.push({ file, schema });
  }
}
if (!ajv.getSchema(CORE_ID)) {
  console.error(`Could not load core schema ${CORE_ID}`);
  process.exit(2);
}

let profileId = null;
if (profilePath) {
  const schema = JSON.parse(await readFile(resolve(process.cwd(), profilePath), "utf-8"));
  profileId = schema.$id;
  if (!profileId) {
    console.error(`error: profile schema ${profilePath} must declare an $id`);
    process.exit(2);
  }
  if (!ajv.getSchema(profileId)) {
    ajv.addSchema(schema);
    loaded.push({ file: profilePath, schema });
  }
}

// Draft (template) validation: same schemas with presence rules stripped, so
// a partially filled template still checks field names, types, enums, and
// patterns without failing on what is not filled in yet.
const PRESENCE_KEYWORDS = ["required", "minItems", "minContains", "minLength", "contains"];
function stripPresence(node) {
  if (Array.isArray(node)) {
    node.forEach(stripPresence);
  } else if (node && typeof node === "object") {
    for (const key of PRESENCE_KEYWORDS) delete node[key];
    for (const v of Object.values(node)) stripPresence(v);
  }
  return node;
}
const draftAjv = newAjv();
for (const { schema } of loaded) {
  draftAjv.addSchema(stripPresence(structuredClone(schema)));
}

// Drop blank placeholders ("", null, and containers left empty) from a draft
// before validating it.
function prune(node) {
  if (Array.isArray(node)) {
    const arr = node.map(prune).filter((v) => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      const p = prune(v);
      if (p !== undefined) out[k] = p;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return node === "" || node === null ? undefined : node;
}

// Compose the mechanism schema for one record: core + only the extensions it
// declares in extensions[]. unevaluatedProperties:false then rejects a field
// whose extension was used but not declared. Policy (e.g. "cdh is required")
// lives in the --profile schema, not here.
function mechanismFor(validator, doc) {
  const declared = list(doc?.extensions);
  const known = [];
  const unknown = [];
  for (const url of declared) {
    if (typeof url !== "string") continue;
    const resolved = toCurrentVersion(url);
    if (validator.getSchema(resolved)) {
      known.push(resolved);
    } else {
      unknown.push(url);
    }
  }
  const schema = {
    allOf: [{ $ref: CORE_ID }, ...known.map((url) => ({ $ref: url }))],
    unevaluatedProperties: false,
  };
  return { schema, known, unknown };
}

// Cross-field rules documented in standard.md that the schema cannot express:
// value-to-value comparisons (dates, lengths), name cross-references between
// arrays, per-property uniqueness, and the SPDX expression grammar. Anything a
// schema keyword can state belongs in the schema, not here.
function checkCrossFieldRules(doc) {
  const out = [];
  if (typeof doc?.cdh_schema_version === "string") {
    const refs = [
      ["$schema", doc?.["$schema"]],
      ...list(doc?.extensions).map((url, i) => [`extensions/${i}`, url]),
    ];
    for (const [path, url] of refs) {
      if (typeof url !== "string") continue;
      const urlVersion = url.match(CDH_VERSIONED_URL)?.[2];
      if (urlVersion && urlVersion !== doc.cdh_schema_version) {
        out.push(
          `/${path}: URL targets ${urlVersion} but cdh_schema_version is ${doc.cdh_schema_version} - a record must reference one release throughout`,
        );
      }
    }
  }
  if (typeof doc?.license === "string" && !validateSpdxExpression(doc.license)) {
    out.push(`/license: must be a valid SPDX license expression`);
  }
  const dims = new Map(list(doc?.dimensions).map((d) => [d?.name, list(d?.values).length]));
  const namedVariables = list(doc?.variables).filter((v) => typeof v?.name === "string").length;
  list(doc?.data).forEach((asset, i) => {
    const tpl = asset?.href_template;
    if (typeof tpl !== "string" || tpl === "") return;
    for (const [, token] of tpl.matchAll(/\{([^}]+)\}/g)) {
      if (token === "variable") {
        if (namedVariables === 0) {
          out.push(
            `/data/${i}/href_template: token {variable} expands over variables[].name, but no named variables are declared (requires the datacube extension)`,
          );
        }
      } else if (!dims.has(token)) {
        out.push(
          `/data/${i}/href_template: token {${token}} has no matching dimensions[].name (requires the datacube extension)`,
        );
      } else if (dims.get(token) === 0) {
        out.push(`/data/${i}/href_template: dimension "${token}" must list its values`);
      }
    }
  });
  const { created, updated } = doc;
  if (typeof created === "string" && typeof updated === "string") {
    if (new Date(updated) < new Date(created)) {
      out.push(`/updated: must be >= created (${created})`);
    }
  }
  const steps = list(doc?.processing);
  const stepIds = new Set();
  steps.forEach((step, i) => {
    if (step?.id == null) return;
    if (stepIds.has(step.id)) out.push(`/processing/${i}/id: duplicate id "${step.id}"`);
    stepIds.add(step.id);
  });
  list(doc?.data).forEach((asset, i) => {
    for (const ref of list(asset?.processing_steps)) {
      if (!stepIds.has(ref)) {
        out.push(`/data/${i}/processing_steps: "${ref}" does not match any processing[].id`);
      }
    }
  });
  const varNames = new Set(list(doc?.variables).map((v) => v?.name));
  list(doc?.classes).forEach((cls, i) => {
    if (cls?.variable != null && !varNames.has(cls.variable)) {
      out.push(`/classes/${i}/variable: "${cls.variable}" does not match any variables[].name`);
    }
  });
  const assetNames = new Set();
  for (const [field, assets] of [
    ["data", doc?.data],
    ["additional_assets", doc?.additional_assets],
  ]) {
    list(assets).forEach((asset, i) => {
      if (asset?.name == null) return;
      if (assetNames.has(asset.name)) {
        out.push(
          `/${field}/${i}/name: duplicate asset name "${asset.name}" - names become asset keys and must be unique across data[] and additional_assets[]`,
        );
      }
      assetNames.add(asset.name);
    });
  }
  const columnNames = new Set(
    [...list(doc?.dimensions), ...list(doc?.variables)]
      .map((c) => c?.name)
      .filter((n) => typeof n === "string"),
  );
  list(doc?.joins).forEach((join, i) => {
    const left = list(join?.left_fields);
    const right = list(join?.right_fields);
    if (left.length && right.length && left.length !== right.length) {
      out.push(
        `/joins/${i}: left_fields (${left.length}) and right_fields (${right.length}) must have the same length`,
      );
    }
    left.forEach((f, k) => {
      if (typeof f === "string" && !columnNames.has(f)) {
        out.push(
          `/joins/${i}/left_fields/${k}: "${f}" does not match any declared dimensions[]/variables[] name`,
        );
      }
    });
  });
  return out;
}

const TEMPLATES_PREFIX = resolve(ROOT, "templates") + sep;
const isDraft = (file) => forceDraft || file.startsWith(TEMPLATES_PREFIX);

// Turn an Ajv error into something an author can act on: name the offending
// property for unevaluated/additional-property errors, and show (a sample of)
// the allowed values for enum misses.
function describeError(err) {
  const p = err.params ?? {};
  // A `false` subschema means "this field is not allowed here" (e.g. temporal
  // date vs start_date/end_date); Ajv's own wording says nothing useful.
  if (err.keyword === "false schema") return "must not be present alongside its sibling fields";
  const stray = p.unevaluatedProperty ?? p.additionalProperty;
  if (stray != null) return `${err.message}: "${stray}"`;
  if (Array.isArray(p.allowedValues)) {
    const sample = p.allowedValues.slice(0, 8).join(", ");
    const more = p.allowedValues.length > 8 ? ", …" : "";
    return `${err.message}: ${sample}${more}`;
  }
  return err.message;
}

// Collect every problem for one file; empty array = valid record.
function validateFile(file, doc) {
  const draft = isDraft(file);
  const validator = draft ? draftAjv : ajv;
  const target = draft ? (prune(doc) ?? {}) : doc;
  const { schema, known, unknown } = mechanismFor(validator, doc);
  if (unknown.length) {
    return {
      draft,
      errors: [
        `unknown extension schema(s): ${unknown.join(", ")}`,
        "fields from an unregistered extension would be rejected - pass --schemas <file-or-dir> to register it",
      ],
    };
  }
  const seen = new Set();
  const validate = validator.compile(schema);
  if (!validate(target)) {
    // When any subschema fails, Ajv also flags every legitimate top-level
    // field as "unevaluated" - keep only strays that no composed schema
    // actually defines.
    const evaluable = new Set();
    for (const id of [CORE_ID, ...known]) {
      for (const key of Object.keys(validator.getSchema(id)?.schema?.properties ?? {})) {
        evaluable.add(key);
      }
    }
    for (const err of validate.errors ?? []) {
      if (
        err.keyword === "unevaluatedProperties" &&
        err.instancePath === "" &&
        evaluable.has(err.params?.unevaluatedProperty)
      ) {
        continue;
      }
      seen.add(`${err.instancePath || "/"}: ${describeError(err)}`);
    }
  }
  if (profileId) {
    const validateProfile = validator.getSchema(profileId);
    if (!validateProfile(target)) {
      for (const err of validateProfile.errors ?? []) {
        // The mechanism layer owns stray-field detection (it knows what was
        // declared); profile-side unevaluated errors are duplicates or noise.
        if (err.keyword === "unevaluatedProperties") continue;
        const text = `${err.instancePath || "/"}: ${describeError(err)}`;
        if (!seen.has(text)) seen.add(`${text} (profile)`);
      }
    }
  }
  if (seen.size) return { draft, errors: [...seen] };
  return { draft, errors: checkCrossFieldRules(target) };
}

let failures = 0;
for (const file of files) {
  let result;
  try {
    // Parse as YAML 1.2 / JSON-style: bare dates stay strings (matching the
    // editor and the JSON output) instead of becoming JS Date objects.
    const doc = yaml.load(await readFile(file, "utf-8"), { schema: yaml.CORE_SCHEMA });
    result = validateFile(file, doc);
  } catch (err) {
    result = { draft: false, errors: [err.message] };
  }
  const invalid = result.errors.length > 0;
  if (expectFail ? invalid : !invalid) {
    console.log(
      `ok   ${rel(file)}${result.draft ? " (draft)" : ""}${expectFail ? " (invalid, as expected)" : ""}`,
    );
  } else {
    failures += 1;
    console.error(`FAIL ${rel(file)}`);
    if (expectFail) {
      console.error("  expected this record to be invalid, but it validated cleanly");
    } else {
      for (const e of result.errors) console.error(`  ${e}`);
    }
  }
}

if (failures > 0) process.exit(1);
