#!/usr/bin/env node
// Bundle the profile schema into one self-contained file with every $ref
// inlined, so any JSON Schema validator can use it from a single URL (or
// offline) without multi-file $ref resolution. The bundle is committed and
// published alongside the source profile (…/profiles/cdh.schema.bundled.json).
//
// Usage:
//   node scripts/bundle-profile.js                   # (re)generate the CDH bundle
//   node scripts/bundle-profile.js --check           # fail if the CDH bundle is stale
//   node scripts/bundle-profile.js <src> [out]       # bundle any profile schema,
//                                                    #   e.g. an adopter's own; out
//                                                    #   defaults to <src minus .schema.json>.schema.bundled.json
//
// $refs to local files resolve from disk; $refs to published URLs (e.g. an
// adopter's profile referencing the CDH core) are fetched. The output $id gets
// the .bundled suffix so the two published files never claim the same
// identifier. The result is compiled with Ajv before writing - a bundle that
// no longer validates never ships.

import $RefParser from "@apidevtools/json-schema-ref-parser";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { newAjv, rel, ROOT } from "./_ajv.js";

const args = process.argv.slice(2).filter((a) => a !== "--check");
const check = process.argv.includes("--check");
const SRC = args[0]
  ? resolve(process.cwd(), args[0])
  : resolve(ROOT, "spec/schemas/profiles/cdh.schema.json");
const OUT = args[1]
  ? resolve(process.cwd(), args[1])
  : SRC.replace(/\.schema\.json$/, ".schema.bundled.json");
if (OUT === SRC) {
  console.error("error: output would overwrite the source - name the source *.schema.json");
  process.exit(2);
}

// $refs resolve against each schema's $id, i.e. its published URL. Serve this
// repo's own URLs from the working tree instead of the network - at release
// time the new version's URLs are not published yet, and local files are the
// source of truth anyway. Foreign URLs are still fetched.
const LOCAL_BASE = /^https:\/\/cgiar-climate-data-hub\.github\.io\/cdh-metadata-standard\/v[^/]+\//;
const localResolver = {
  order: 1,
  canRead: LOCAL_BASE,
  read: (file) => readFile(resolve(ROOT, "spec", file.url.replace(LOCAL_BASE, "")), "utf-8"),
};

let schema;
try {
  schema = await $RefParser.dereference(SRC, { resolve: { local: localResolver } });
} catch (err) {
  console.error(`error: could not resolve a $ref while bundling ${rel(SRC)}:`);
  console.error(`  ${err.message}`);
  console.error(
    "  every $ref must resolve; relative $refs resolve against the schema's $id (its published URL), so publish referenced schemas first - or omit $id to resolve them from local files",
  );
  process.exit(1);
}
if (schema.$id) schema.$id = schema.$id.replace(/\.schema\.json$/, ".schema.bundled.json");

// Dereferencing inlines other schemas together with their $id / $schema,
// which validators reject as duplicate identifiers - strip them below the
// root. With every $ref resolved, $defs are dead weight too.
function strip(node, root = false) {
  if (Array.isArray(node)) {
    node.forEach((v) => strip(v));
  } else if (node && typeof node === "object") {
    if (!root) {
      delete node.$id;
      delete node.$schema;
    }
    delete node.$defs;
    for (const v of Object.values(node)) strip(v);
  }
}
strip(schema, true);
if (JSON.stringify(schema).includes('"$ref"')) {
  console.error("unresolved $ref left in bundle - refusing to write");
  process.exit(1);
}

// Never ship a bundle that stopped being a valid schema.
newAjv().compile(schema);

const next = JSON.stringify(schema, null, 2) + "\n";

if (check) {
  const current = await readFile(OUT, "utf-8").catch(() => null);
  if (current !== next) {
    console.error(`stale ${rel(OUT)}: run \`npm run bundle-profile\` and commit the result`);
    process.exit(1);
  }
  console.log(`ok   ${rel(OUT)}`);
} else {
  await writeFile(OUT, next);
  console.log(`wrote ${rel(OUT)}`);
}
