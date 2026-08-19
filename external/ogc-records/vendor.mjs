// Regenerates recordGeoJSON.schema.json — a self-contained, ajv/jsonschema-ready
// copy of the OGC API - Records 1.0 record schema, used to validate CDH records
// routed to OGC API - Records.
//
// Run ONLY when bumping to a new OGC Records release (the build dep is not kept
// in package.json — it's a once-per-release tool):
//
//   npm i --no-save @apidevtools/json-schema-ref-parser
//   node external/ogc-records/vendor.mjs
//
// Why vendored + patched instead of fetched live:
//   - Deterministic, offline validation pinned to a named spec version (1.0),
//     the same way records pin cdh_schema_version and STAC extension URLs.
//   - Upstream writes geometry/properties/time as
//       oneOf: [{type: object, nullable: true}, {$ref: realThing}]
//     an OpenAPI idiom for "nullable" that a STRICT JSON Schema validator rejects
//     on VALID records (a real object matches both branches). We rewrite those
//     decoy branches to {type: "null"} so null and the real value each match one.

import $RefParser from "@apidevtools/json-schema-ref-parser";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "1.0";
const SRC = `https://schemas.opengis.net/ogcapi/records/part1/${VERSION}/openapi/schemas/recordGeoJSON.yaml`;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "recordGeoJSON.schema.json");

// Rewrite OGC's OpenAPI "nullable" decoy branches into real JSON Schema null.
const fix = (n) =>
  Array.isArray(n)
    ? n.map(fix)
    : n && typeof n === "object"
      ? n.type === "object" && n.nullable === true && Object.keys(n).length === 2
        ? { type: "null" }
        : Object.fromEntries(Object.entries(n).map(([k, v]) => [k, fix(v)]))
      : n;

// bundle() merges every external $ref (file + http, YAML/JSON) into one doc,
// rewriting them to internal "#/..." refs; circular geometry refs are kept as-is.
const bundled = fix(await $RefParser.bundle(SRC, { dereference: { circular: "ignore" } }));

const out = {
  $comment:
    `Vendored from OGC API - Records ${VERSION}: ${SRC}. External $refs bundled to ` +
    `internal #/ refs; OpenAPI "nullable" decoy branches ({type:object,nullable:true}) ` +
    `rewritten to {type:"null"} for strict JSON Schema validation. ` +
    `Do not edit by hand — regenerate with external/ogc-records/vendor.mjs.`,
  ...bundled,
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`wrote ${OUT}`);
