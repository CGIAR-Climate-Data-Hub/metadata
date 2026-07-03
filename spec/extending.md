# Extending and adopting the standard

How to add your own fields to CDH records, or adopt the core standard for your own catalog. The
extension mechanism is defined in [`standard.md`](./standard.md) section 4.3; this is the practical
walkthrough.

## 1. Author your extension

Copy [`extensions/_template/`](./extensions/_template/README.md). One extension = one self-contained
JSON Schema that nests all of its fields under a single top-level key named after the extension:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://<you>.github.io/<repo>/v1.0.0/soil/schema.json",
  "title": "Soil Extension",
  "type": "object",
  "properties": {
    "soil": {
      "type": "object",
      "additionalProperties": false,
      "properties": { "depth": { "type": "string", "minLength": 1 } }
    }
  }
}
```

Publish it at a stable, version-pinned URL (GitHub Pages works well) and set `$id` to that URL. You
never need to touch the CDH repo.

## 2. Declare it in records

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.1.0/extensions/cdh/schema.json
  - https://<you>.github.io/<repo>/v1.0.0/soil/schema.json
soil:
  depth: 0-30cm
```

A record is validated against the core composed with exactly the extensions it declares - fields
from an undeclared extension are rejected.

## 3. Your profile is a bundle schema

A profile is policy: which extensions your records use, plus any completeness rules. It is a
~10-line schema, like the CDH one (`schemas/profiles/cdh.schema.json`):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://<you>.github.io/<repo>/v1.0.0/profiles/mine.schema.json",
  "allOf": [
    {
      "$ref": "https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.1.0/schemas/core.schema.json"
    },
    { "$ref": "https://<you>.github.io/<repo>/v1.0.0/soil/schema.json" }
  ],
  "unevaluatedProperties": false
}
```

Add `required` / `contains` constraints for your own house rules. Bind it in YAML editors for
autocomplete and validation:

```yaml
# yaml-language-server: $schema=https://<you>.github.io/<repo>/v1.0.0/profiles/mine.schema.json
```

## 4. Validate

The schemas are the contract - any JSON Schema 2020-12 validator works; no CDH tooling is required.
For CDH records, use the published **single-file bundle** (all `$refs` inlined, so no multi-file
resolution is needed):

```sh
check-jsonschema \
  --schemafile https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.1.0/schemas/profiles/cdh.schema.bundled.json \
  record.yaml
```

For your own profile, either publish all referenced schemas and use a validator that resolves remote
`$refs`, or produce your own single-file bundle (see `scripts/bundle-profile.js`).

This repo's validator (`scripts/validate-yaml.js`) adds the CDH pipeline checks on top of the
schema: per-record extension composition (the mechanism), draft mode for templates, and the
cross-field rules documented in the standard. Policy is supplied, never baked in - the CDH pipeline
passes its own profile the same way you pass yours:

```sh
# mechanism only: core + whatever extensions each record declares
node scripts/validate-yaml.js --schemas my-extensions/ my-records/

# with your profile as the policy layer (what the CDH pipeline does with its own)
node scripts/validate-yaml.js --profile my-profile.schema.json --schemas my-extensions/ my-records/
```

In CI, call the reusable workflow the same way:

```yaml
jobs:
  validate:
    uses: CGIAR-Climate-Data-Hub/metadata/.github/workflows/validate-records.yaml@main
    with:
      path: ./my-records
      extra-schemas: ./my-extensions
      profile: ./my-profile.schema.json # default "cdh"; "" = mechanism only
```

## 5. Submitting to the Hub

Records submitted to the CDH that declare a non-CDH extension must include the extension schema so
Hub CI can register it (`--schemas`). A field that outlives one project or center is a sign it
should be proposed as a shared CDH extension instead (standard §4.3).
