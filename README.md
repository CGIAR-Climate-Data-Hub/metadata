# Climate Data Hub Metadata Standard

This repository defines the Climate Data Hub metadata standard, input schema, and authoring
templates. Records are validated against the schema and mapped to STAC or OGC API Records.

> \[!WARNING] This standard is still a draft. Breaking changes are expected while it is being tested
> and refined.

## Start Here

- [Authoring guide](./spec/authoring-guide.md) - how to fill out metadata.
- [Templates](./templates) - fillable YAML starting points for common record types.
- [Full template](./templates/full-standard.yaml) - the complete metadata input structure.
- [Core schema](./spec/schemas/core.schema.json) - validates the YAML structure and controlled
  values.
- [Standard](./spec/standard.md) - formal field definitions and validation expectations.
- [Extending & adopting](./spec/extending.md) - add your own extension, build a profile, or adopt
  the core standard outside the Hub.

## Mappings

- [Crosswalk](./spec/crosswalk.md) - CDH fields mapped to STAC and OGC API Records.
- [STAC mapping](./spec/mapping-stac.md)
- [OGC API Records mapping](./spec/mapping-ogc-records.md)

## Vocabularies

Controlled vocabularies live in [vocab/](./vocab):

- [domain.json](./vocab/domain.json)
- [resource_type.json](./vocab/resource_type.json)
- [commodity.json](./vocab/commodity.json)

Vocabulary files are validated against
[spec/schemas/vocab/vocabulary.schema.json](./spec/schemas/vocab/vocabulary.schema.json).

After editing a vocabulary, regenerate the schema fragments:

```sh
npm run gen-schemas
```

## Versioning

The standard, schemas, vocabularies, and extensions share one `v<MAJOR>.<MINOR>.<PATCH>` git tag
(see [`spec/standard.md`](spec/standard.md) section 2 for the model).

To cut a release, set `<PREV>` to the current version and `<NEW>` to the next:

```sh
npm version --no-git-tag-version <NEW>     # bumps package.json + lock
npm run gen-schemas                         # regenerates the vocab schemas

# Bump the version pinned in hand-authored files (schema $ids, extension URLs,
# docs, templates, examples); unrelated code versions are left untouched.
grep -rl "/v<PREV>/" spec templates examples README.md \
  | xargs sed -i "s|/v<PREV>/|/v<NEW>/|g"
sed -i 's/cdh_schema_version: "v<PREV>"/cdh_schema_version: "v<NEW>"/' \
  templates/*.yaml examples/*/*.yaml
```

Then commit, run `npm test`, and publish a GitHub release tagged `v<NEW>`.

## Validation

All validation runs through `npm`:

```sh
npm install        # one-time, installs dev tooling
npm test           # formatting + markdown lint + schema/vocab/yaml validation
npm run check      # schemas + vocabs + compile + bundle + yaml + negative fixtures
```

Individual targets: `check-schemas`, `check-vocabs`, `compile-schemas`, `check-yaml`,
`check-invalid`, `bundle-profile`, `gen-schemas`, `lint-md`.

Records under [`tests/invalid/`](./tests/invalid/README.md) are negative fixtures - each MUST fail
validation. They catch schema or rule changes that accidentally loosen validation.

## Acknowledgements

The npm-based validation pipeline and schema-publishing workflow are adapted from/inspired by the
[stac-extensions/template](https://github.com/stac-extensions/template) project.
