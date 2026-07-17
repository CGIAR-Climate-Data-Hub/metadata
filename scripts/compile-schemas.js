#!/usr/bin/env node
// Compile every CDH JSON Schema to catch broken $refs and dialect issues, and
// check every $id carries the version from package.json - a stale $id would
// otherwise surface as a confusing "could not load schema" in validate-yaml,
// or publish files whose $ids point at the previous release.

import { findSchemaFiles, newAjv, rel, ROOT } from "./_ajv.js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const files = await findSchemaFiles();
if (files.length === 0) {
  console.log("No schemas found under spec/schemas or spec/extensions.");
  process.exit(0);
}

const { version } = JSON.parse(await readFile(resolve(ROOT, "package.json"), "utf-8"));
const ID_BASE = `https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v${version}/`;

const ajv = newAjv();

// Register every schema first so cross-file $refs resolve.
const schemas = [];
let failures = 0;
for (const file of files) {
  const schema = JSON.parse(await readFile(file, "utf-8"));
  if (!schema.$id?.startsWith(ID_BASE)) {
    failures += 1;
    console.error(
      `FAIL ${rel(file)}: $id does not match package.json version ${version} - update the $id to start with ${ID_BASE}`,
    );
  }
  ajv.addSchema(schema);
  schemas.push({ file, schema });
}

for (const { file, schema } of schemas) {
  try {
    ajv.compile(schema);
    console.log(`ok   ${rel(file)}`);
  } catch (err) {
    failures += 1;
    console.error(`FAIL ${rel(file)}: ${err.message}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} schema(s) failed to compile.`);
  process.exit(1);
}
