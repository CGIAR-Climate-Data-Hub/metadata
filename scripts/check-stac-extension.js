#!/usr/bin/env node
// Validate the CDH STAC extension: its examples must match the schema, its
// `invalid-*` examples must not, and its published URLs must carry this
// release's version.
//
// The extension schema is draft-07, as STAC extensions are, so it gets its own
// Ajv instance rather than the 2020-12 one the input schemas use.

import { readdir, readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

import Ajv from "ajv";

import { rel, ROOT } from "./_ajv.js";

const DIR = resolve(ROOT, "spec/encodings/stac");
const { version } = JSON.parse(await readFile(resolve(ROOT, "package.json"), "utf-8"));

const schema = JSON.parse(await readFile(resolve(DIR, "schema.json"), "utf-8"));
const errors = [];

// The $id and the stac_extensions URL a record must declare have to name this
// release, or published records point at a schema that does not describe them.
const expected = `/v${version}/encodings/stac/schema.json`;
for (const [what, url] of [
  ["$id", schema.$id],
  ["stac_extensions const", schema.properties?.stac_extensions?.contains?.const],
]) {
  if (typeof url !== "string" || !url.includes(expected)) {
    errors.push(`${what}: expected a URL containing ${expected}, got ${url}`);
  }
}

const ajv = new Ajv({ strict: false, allErrors: true });
let validate;
try {
  validate = ajv.compile(schema);
} catch (err) {
  console.error(`FAIL ${rel(resolve(DIR, "schema.json"))}\n  ${err.message}`);
  process.exit(1);
}

const files = (await readdir(resolve(DIR, "examples"))).filter((f) => f.endsWith(".json")).sort();
for (const file of files) {
  const path = resolve(DIR, "examples", file);
  const doc = JSON.parse(await readFile(path, "utf-8"));
  const valid = validate(doc);
  const mustFail = basename(file).startsWith("invalid-");
  if (valid === mustFail) {
    errors.push(
      mustFail
        ? `${rel(path)}: expected this example to be invalid, but it validated cleanly`
        : `${rel(path)}: ${ajv.errorsText(validate.errors)}`,
    );
  } else {
    console.log(`ok   ${rel(path)}${mustFail ? " (invalid, as expected)" : ""}`);
  }
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL ${e}`);
  process.exit(1);
}
console.log(`ok   spec/encodings/stac/schema.json (v${version})`);
