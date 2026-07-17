// Shared Ajv setup for CDH validation scripts.
//
// All CDH JSON Schemas use the 2020-12 dialect; Ajv exposes that draft via
// the `ajv/dist/2020.js` entry point. We register every schema in
// `spec/schemas/` so cross-file `$ref`s (e.g., the vocab fragments) resolve
// regardless of which schema is being compiled.

import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function newAjv() {
  // Default Ajv constructor under ESM is on `.default`.
  const Ctor = Ajv2020.default ?? Ajv2020;
  const Formats = addFormats.default ?? addFormats;
  const ajv = new Ctor({
    allErrors: true,
    strict: false,
    allowUnionTypes: true,
  });
  Formats(ajv);
  return ajv;
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    // _-prefixed dirs (e.g. extensions/_template) are scaffolding, not schemas.
    if (entry.isDirectory() && entry.name.startsWith("_")) continue;
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (
      entry.isFile() &&
      (entry.name.endsWith(".schema.json") || entry.name === "schema.json")
    ) {
      out.push(path);
    }
  }
  return out;
}

export async function findSchemaFiles() {
  const dirs = [resolve(ROOT, "spec/schemas"), resolve(ROOT, "spec/extensions")];
  const out = [];
  for (const dir of dirs) {
    try {
      out.push(...(await walk(dir)));
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }
  return out;
}

export async function loadAllSchemas(ajv) {
  const files = await findSchemaFiles();
  const schemas = [];
  for (const file of files) {
    const schema = JSON.parse(await readFile(file, "utf-8"));
    ajv.addSchema(schema);
    schemas.push({ file, schema });
  }
  return schemas;
}

export function rel(path) {
  return path.startsWith(ROOT + sep) ? path.slice(ROOT.length + 1) : path;
}
