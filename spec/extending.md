# Extending and adopting the standard

Add your own fields to CDH records, or use the core standard in another catalog. The full rule is in
[`standard.md`](./standard.md) section 4.2.

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

Publish it at a stable, version-pinned URL and set `$id` to that URL.

## 2. Declare it in records

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.2.0/extensions/cdh/schema.json
  - https://<you>.github.io/<repo>/v1.0.0/soil/schema.json
soil:
  depth: 0-30cm
```

A record is validated against the core composed with exactly the extensions it declares - fields
from an undeclared extension are rejected.

## 3. Add a profile

This is not strictly necessary, but it is helpful for editors and tools that want one contained
schema file. A profile is policy: which extensions are allowed, plus any completeness rules. A small
schema is enough:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://<you>.github.io/<repo>/v1.0.0/profiles/mine.schema.json",
  "allOf": [
    {
      "$ref": "https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.2.0/schemas/core.schema.json"
    },
    { "$ref": "https://<you>.github.io/<repo>/v1.0.0/soil/schema.json" }
  ],
  "unevaluatedProperties": false
}
```

Add `required` / `contains` constraints for your own rules. Declare the profile in records and bind
it in YAML editors:

```yaml
# yaml-language-server: $schema=https://<you>.github.io/<repo>/v1.0.0/profiles/mine.schema.json
"$schema": https://<you>.github.io/<repo>/v1.0.0/profiles/mine.schema.json
```

## 4. Validate

Any JSON Schema 2020-12 validator works. For CDH records, use the bundled profile:

```sh
check-jsonschema \
  --schemafile https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.2.0/schemas/profiles/cdh.schema.bundled.json \
  record.yaml
```

For your own profile, publish the referenced schemas or create a single-file bundle with
`scripts/bundle-profile.js`.

This repo's validator adds per-record extension checks, template draft mode, and cross-field rules:

```sh
# mechanism only: core + whatever extensions each record declares
node scripts/validate-yaml.js --schemas my-extensions/ my-records/

# with your profile
node scripts/validate-yaml.js --profile my-profile.schema.json --schemas my-extensions/ my-records/
```

In CI:

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

Records submitted to the Hub with a non-CDH extension must include that schema so CI can register it
with `--schemas`. Shared fields should become shared extensions.
