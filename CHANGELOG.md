# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the project is pre-1.0, the schema should be considered unstable and breaking changes may
occur between minor versions.

## [Unreleased]

## [0.2.0] - 2026-07-17

### Added

- Made `temporal` precision-aware: added `date` (a single instant or period) alongside
  `start_date`/`end_date` (a span; `end_date: null` = open-ended), which are mutually exclusive.
  Dates take any strict ISO 8601 precision - year (`2020`), month (`2020-06`), day, or datetime -
  and the precision states the granularity, so `date: 2020` is the whole year. A reduced-precision
  `end_date` is inclusive through the end of its period. Maps 1:1 to STAC
  `datetime`/`start_datetime`/`end_datetime`.
- Added `step` (ISO 8601 duration, valid only on a `type: temporal` dimension) to the datacube
  extension. Temporal cadence is now expressed as `type: temporal` dimension(s) - one per temporal
  axis, so a cube can carry several (e.g. `season` within 20-year `period`s). The lat/lon grid still
  comes from `spatial` (derived, not declared; `variables[].dimensions` may reference `lat`/`lon`).
- Added `joins[]` to the datacube extension so a table can join to other catalogued datasets - e.g.
  a value table keyed to an external boundary set instead of embedding geometry. Each entry is
  `{ target, left_fields, right_fields }`, pairing this record's key columns with the target's
  positionally, so composite keys (`[adm0_code, adm2_code]`) and differing column names are handled.
  `left_fields` are validated against declared `dimensions[]`/`variables[]` names, and the two field
  arrays must be equal length. Value columns stay `variables[]`; key columns are `dimensions[]`.
- Added optional `series` (`{ name, url }`, `name` required) to group records by dataset series /
  product family (e.g., MapSPAM, GLW), independent of the version chain. Maps to `cgiar-cdh:series`
  in STAC and `dcat:inSeries` (DCAT 3) in OGC Records.

- Added `access` so access conditions are separate from `license`. Values are `public`,
  `restricted`, and `non-public`; omitted means `public`.
- Added resource versioning rules: when to update a record in place, snapshot a superseded release,
  or fork a new resource. The unversioned `id` always identifies the current release; snapshots
  append the version to the `id`, set `deprecated: true`, and are linked via `previous_version`.
  Encoders derive successor/latest links from the chain.
- Added cross-field validation for rules JSON Schema cannot express: date order, processing-step
  references, class-variable references, `href_template` tokens, reserved keyword schemes, and
  unique asset names.
- Added `--profile`, `--schemas`, and `--expect-fail` to `validate-yaml`, with matching `profile` /
  `extra-schemas` inputs on the reusable validation workflow. This lets adopters validate their own
  extensions and policy schemas.
- Added a bundled CDH profile schema (`cdh.schema.bundled.json`) and bundle checks so validators can
  use one file without resolving CDH `$refs`.
- Added extension-adoption docs, an extension template, and the rule that new extensions should use
  one top-level key named after the extension.
- Added negative fixtures in `tests/invalid/` to catch schema or validation rules getting
  accidentally loosened.
- Added the reserved `{variable}` `href_template` token, which expands over `variables[].name` for
  datasets split into one file per variable. `variable` is rejected as a dimension name.
- Added version guards so schema `$id`s must match `package.json`, and release tags must match the
  package version before publishing.

### Changed

- `spatial.bbox` no longer requires a hand-authored overall/union box first. Provide a single box,
  or a list of the real areas covered (in any order) for disjoint coverage; the encoder derives the
  overall extent when serializing.
- The `service` resource type now maps to schema.org `Service` (a core type) instead of `WebAPI` (a
  pending type with weaker consumer support), matching the concept's broad scope.
- added a $schema field to allow persistent schema and versioning across tooling/conversion between
  formats.
- **Breaking:** schemas now reject blank strings, empty required arrays, and stray `null`s. Omit
  unknown values instead; `null` only remains for open-ended temporal intervals.
- **Breaking:** every `contact[]` entry must include `organization`.
- **Breaking:** `data[]` and `additional_assets[]` entries must include `name`; it becomes the
  serialized asset key and must be unique.
- `created` and `updated` are optional in input YAML and filled at publication. Serialized records
  still include both.
- `extensions[]` is documented as required and must include the `cdh` extension for Hub records.
- Validation now has two layers: mechanism (core plus declared extensions) and profile (policy
  schema passed with `--profile`). CDH uses the same path as adopters.
- Templates now validate in draft mode: blanks are pruned and presence checks are relaxed, while
  field names, types, enums, and patterns are still checked.
- OGC Records mapping now uses standard GeoDCAT / `dct:` terms where available, starting with
  `access` and `spatial.geography[]`.
- `derived_from[]` entries should point at version-specific source URLs rather than URLs that track
  the latest release.
- Unquoted ISO dates in YAML now work because the validator parses YAML 1.2 core values as strings.
- Formatting and linting moved to Prettier and markdownlint.

### Removed

- **Breaking:** removed the `ai-skill` resource type; AI skills are no longer catalogued as Hub
  records, and its schema.org mapping (`SoftwareApplication`) was a stretch. Remaining values are
  `dataset`, `software`, `service`, and `document`.
- **Breaking:** removed `temporal.resolution`. `temporal` is coverage extent only (see the
  precision-aware `date`/`start_date`/`end_date` fields under Added); temporal cadence now lives on
  a `type: temporal` dimension with an ISO 8601 `step`.

### Fixed

- Unknown extension URLs now fail with a clear `--schemas` message instead of a misleading warning.
- Validation output is shorter and more useful: offending fields are named, enum options are shown,
  duplicates are collapsed, and noisy Ajv `unevaluatedProperties` cascades are filtered.
- Fixed field-reference/checklist drift around `cdh_schema_version`, `citation` vs DOI, temporal
  coverage, variables/dimensions, and `extensions[]`.
- Fixed the `resource_type` schema description so it matches the vocabulary.
- Consolidated duplicate bbox and `href_template` guidance, and cleaned up extension README bullets
  and typos.

## [0.1.0] - 2026-06-24

### Changed

- **Breaking:** `contact[].role` (single string) is now `contact[].roles[]` (an array), aligning
  with STAC `providers[].roles` and OGC Records `contacts[].roles`. A contact may hold several
  roles, e.g. `roles: [producer, licensor]`. The role vocabulary dropped `host` and added
  `point-of-contact` (which maps to the Contacts extension, not `providers`).
- **Breaking:** `citation` is now a structured object
  (`{ authors, date, title?, publisher?, url? }`) instead of a plain string, and
  `related_publications[].citation` uses the same shape. `citation` is required unless a `doi` is
  provided.
- Relaxed the `unit` requirement from strict UDUNITS-2 to "preferably UDUNITS-2 or UCUM," allowing
  annotated units such as `{head}/km2`.
- **Breaking:** `doi` (and `related_publications[].doi`) must now be a bare DOI (e.g.
  `10.7910/DVN/SWPENT`); URL forms like `https://doi.org/…` are rejected.
- `spatial.bbox` now also accepts a single box `[west, south, east, north]`, not only an array of
  boxes.

### Added

- Date fields document the expected format via descriptions and examples (`YYYY-MM-DD` or RFC 3339
  date-time).
- Field `description`s (and a few `examples`) added across the core schema and all extensions for
  in-editor hints; `media_type` suggests common values.

## \[0.0.2] - 2026-06-22 \[YANKED]

> Published as a pre-release, then withdrawn due to a bug/typo that published the schemas to the
> wrong path, so the versioned schema URLs returned 404. Superseded by 0.1.0.

### Changed

- Restructured the schema into a small `core` plus opt-in extensions (`cdh`, `climate`, `datacube`,
  `classification`, `agriculture`). Records declare the extensions they use and validate against a
  composed profile; fields from undeclared extensions are rejected.
- `resource_type` now uses schema.org types instead of COAR.

### Added

- `href_template` on `data[]` entries, to expand one entry into many items.
- Crop and livestock roots (and GLW4 crops) in the commodity vocabulary.

### Removed

- `encoding` field.
- `climate.hazards` field and its vocabulary.
- `themes` from the authoring spec (it is encoder output only).

## [0.0.1] - 2026-06-03

### Added

- Initial prototype of the core metadata specification, controlled vocabularies, and supporting
  build scripts.

[Unreleased]: https://github.com/CGIAR-Climate-Data-Hub/cdh-metadata-standard/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/CGIAR-Climate-Data-Hub/cdh-metadata-standard/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/CGIAR-Climate-Data-Hub/cdh-metadata-standard/releases/tag/v0.0.1
