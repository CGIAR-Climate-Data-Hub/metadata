#!/usr/bin/env node
// The bundled CDH profile is advertised for plain JSON Schema validators.
// Keep one focused check that it rejects first-party extension fields when the
// matching extension URL is missing from extensions[].

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { newAjv, rel, ROOT } from "./_ajv.js";

const PROFILE = resolve(ROOT, "spec/schemas/profiles/cdh.schema.bundled.json");

const EXTENSIONS = {
  cdh: "https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.3.0/extensions/cdh/schema.json",
  climate:
    "https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.3.0/extensions/climate/schema.json",
  datacube:
    "https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.3.0/extensions/datacube/schema.json",
  classification:
    "https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.3.0/extensions/classification/schema.json",
  agriculture:
    "https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.3.0/extensions/agriculture/schema.json",
};

const base = {
  $schema:
    "https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.3.0/schemas/profiles/cdh.schema.json",
  cdh_schema_version: "v0.3.0",
  extensions: [EXTENSIONS.cdh],
  id: "fixture-record",
  title: "Fixture record",
  description: "A deliberately small record for profile-bundle checks.",
  license: "CC-BY-4.0",
  resource_type: "dataset",
  keywords: ["fixture"],
  cdh: { domain: ["climate"] },
  contact: [{ organization: "Test Org", roles: ["licensor"] }],
  citation: { authors: ["Doe, J."], date: "2026" },
  data: [{ name: "primary", locations: [{ url: "https://example.org/data.tif" }] }],
};

const cases = [
  {
    name: "climate",
    extension: EXTENSIONS.climate,
    field: { climate: { mip_era: "CMIP6" } },
  },
  {
    name: "datacube",
    extension: EXTENSIONS.datacube,
    field: {
      dimensions: [
        {
          name: "crop",
          type: "crop",
          description: "Crop code axis.",
        },
      ],
    },
  },
  {
    name: "classification",
    extension: EXTENSIONS.classification,
    field: { classes: [{ variable: "land_cover", values: [{ value: 1, label: "Cropland" }] }] },
  },
  {
    name: "agriculture",
    extension: EXTENSIONS.agriculture,
    field: { commodities: ["maize"] },
  },
];

const schema = JSON.parse(await readFile(PROFILE, "utf-8"));
const validate = newAjv().compile(schema);

let failures = 0;
for (const test of cases) {
  const undeclared = { ...base, ...test.field };
  if (validate(undeclared)) {
    failures += 1;
    console.error(`FAIL ${test.name}: bundled profile allowed field without extension URL`);
  }

  const declared = {
    ...undeclared,
    extensions: [...base.extensions, test.extension],
  };
  if (!validate(declared)) {
    failures += 1;
    console.error(`FAIL ${test.name}: bundled profile rejected field with extension URL`);
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || "/"}: ${err.message}`);
    }
  }
}

if (failures > 0) process.exit(1);
console.log(`ok   ${rel(PROFILE)} first-party extension declarations`);
