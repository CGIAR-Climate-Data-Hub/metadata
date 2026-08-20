# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the project is pre-1.0, the schema should be considered unstable and breaking changes may
occur between minor versions.

## [Unreleased]

## [0.3.0] - 2026-08-20

### Added

- Added the `example` asset role for `additional_assets[]` - a runnable usage example (notebook,
  script, or SQL file), which is the place for a query a consumer needs but the data itself cannot
  carry, such as a required join. `roles` stays an open list; the suggested values are now carried
  in the schema so editors offer them.
- Added section 4.8, catalog position: a record's place in the catalog comes from where its file
  sits. The record in a directory is that directory's node, records in subdirectories are its
  children, and a pure grouping directory (one holding no record of its own) becomes a navigation
  node named after the directory. Position adds parent and child links only - no value is ever
  inherited from a parent, child, or sibling - and a child is nested only when it has no standing
  outside its parent. Version snapshots sit beside their record and are never children.
- Added `variables[].nodata` to the datacube extension, for stores whose variables carry different
  fill values (a `float32` measure filled with `-9999` beside a `uint8` classification filled with
  `255`). `data[].nodata` remains the asset default and a variable's own value replaces it for that
  variable alone. A single GeoTIFF never needs it, since its bands share one data type and one fill
  value.
- Section 4.6 now states which fields are machine-derivable from the data and which are always
  authored, with three rules: an authored value always wins, machine-derivable fields are never
  required of the author, and a disagreement between an authored value and the data is a review
  finding rather than an automatic correction.
- Added editor hints across the schemas - `examples` on `id`, contact `email`, contact
  `organization` (the CGIAR centers, so the same centre is not spelled three ways), join `target`,
  asset `roles`, and dimension `type`, and `title` on each bbox coordinate - so editors bound to the
  profile suggest values and label positional array members.
- Added `cdh.usage.intended_uses`, a free-text list of the uses a resource was produced for, encoded
  as `cgiar-cdh:intended_uses`. The list is **illustrative and never exhaustive**: a use that is
  absent is not excluded, and a listed use is not an endorsement for a particular decision. It is
  optional, is not a filter facet (`cdh.domain` remains the field browse and filtering use), and
  limitations stay in `cdh.usage.not_recommended_for` with their reasons. Added on request from CDH
  management, over the objection recorded in `_decisions.md` - the same objection that removed
  `cdh.use_cases` in `7897ac6`.
- Added the CGIAR CDH **STAC extension** at `spec/encodings/stac/`, mirroring the layout of the
  official `stac-extensions` template: `schema.json` (draft-07, as STAC extensions are), a README
  with the field tables, and Collection and Item examples. It defines the fifteen `cgiar-cdh:*`
  fields a record carries into STAC that no native field or community extension covers, and closes
  the namespace with `additionalProperties: false` plus a negative-lookahead `patternProperties`, so
  an undefined `cgiar-cdh:*` field - or a defined one in the wrong place - fails validation. Scope
  is Collection, Item properties, assets, and links; a Catalog carries none, since a CDH grouping
  node has no description of its own. Published to `<base>/v<TAG>/encodings/stac/schema.json` with
  the rest of the release, and checked in CI by `npm run check-examples`, the `stac-node-validator`
  invocation the official extension template uses. This makes the "every `cgiar-cdh:*` field MUST be
  defined" rule in `mapping-stac.md` true rather than aspirational.
- Added `cgiar-cdh:partition`, which records where a file or Item sits on the axes its record
  declares. The shape is contextual: an asset states one scalar per axis (the file's exact
  position), an Item lists the values it spans. This gives the token values from an `href_template`
  expansion a named home, which `mapping-stac.md` section 5.2 previously described without naming.
- Published the cross-field checks as `spec/checks/cross-field.js`, mirrored to
  `<base>/v<TAG>/checks/cross-field.js` beside the schema and pinned to the same release. It is
  dependency-free ESM, so the same source runs in Node and in a browser; the SPDX expression
  validator is injected (`check(record, { isSpdx })`) because it is the only rule that needs a
  library. `scripts/validate-yaml.js` now imports this module instead of carrying its own copy, so a
  form or app validates against exactly the rules the pipeline applies.

### Changed

- **Breaking:** a templated (`href_template`) entry no longer always emits one STAC Item per token
  combination. When a token resolves to a `type: temporal` dimension it still does, with that
  token's value as the Item `datetime` - a time axis has to be Items for Open Data Cube and similar
  readers to see a series. With no temporal token, the expansion becomes one Item holding every file
  as an asset, spanning the record's extent via `start_datetime` / `end_datetime`, and its `id`
  names the representation rather than a position. Splitting on a domain axis scattered one dataset
  across Items that differ in no way a client can order, and left every Item with a single asset -
  which made `cgiar-cdh:partition`'s two shapes say the same thing twice.
- **Breaking:** `cdh.not_recommended_for` moved to `cdh.usage.not_recommended_for`. Use guidance now
  sits under one `cdh.usage` object alongside `intended_uses`, so the guidance fields stop competing
  with `domain` for space at the top of the `cdh` object and the next one has an obvious home. The
  encoding is unchanged: both members still emit flat as `cgiar-cdh:not_recommended_for` and
  `cgiar-cdh:intended_uses`, the same way `spatial.*` flattens, because STAC and OGC Records
  property namespaces cannot re-nest. An empty `usage` object is rejected; omit it when there is
  nothing to say.
- **Breaking:** `spatial.resolution` now allows exactly one spatial characterization per record: a
  single entry, or an `x` + `y` pair where grid spacing differs. A grid entry beside a `point` or
  `polygon` entry is rejected. A representation of the same data at a different resolution (polygon
  aggregates of a grid) is a separate record, and resolution is never stated per asset.
- **Breaking:** every `spatial.resolution[]` entry must state `type`.
- **Breaking:** removed `spatial.resolution[].note`. With one characterization allowed per record it
  was a record-level caveat living inside an array; use the record-level `note`.
- **Breaking:** a `type: temporal` dimension's `values` must be ISO 8601 dates or instants, written
  as strings. Bare numbers (`2030`) and range labels (`2020-2040`) are rejected, because the STAC
  datacube extension requires ISO 8601 strings there and neither form is one. A **binned** axis
  lists each bin's start and gives its length as the `step` - 20-year windows are
  `values: ["2021", "2041"]` with `step: P20Y` - and the readable form (`2021-2040`) is derived from
  value plus step rather than authored. A **cyclic** label axis (`DJF`/`MAM`/`JJA`/`SON`) is not
  temporal at all: it repeats every year instead of running in one direction, so it is a domain axis
  named after what it varies, with the duration each label covers stated in `description`. Several
  temporal dimensions remain valid when each carries real dates - files split by year with a day
  column inside, or one store holding a yearly climatology beside a daily field.
- **Breaking:** `dimensions[]` and `variables[]` names must now be unique across both arrays. They
  share one namespace: `cube:dimensions` and `cube:variables` are keyed by name, so a duplicate
  silently overwrote its twin on encode and an axis or a measure vanished from the published cube
  with no error anywhere. The names are also a table's columns and the tokens `href_template`
  resolves against, both of which a duplicate makes ambiguous.
- **Breaking:** `dimensions[].type` no longer accepts `spatial` or `geometry`. Neither is encodable:
  the STAC datacube extension requires `axis` and `extent` on a spatial dimension, which a CDH
  record does not carry, and it forbids both words outright as custom dimension types. The
  horizontal grid stays derived from the top-level `spatial` field. Two reserved values replace the
  uses that were being made of `spatial`:
  - `z` for a vertical axis - soil depth, height, pressure level - which serializes as
    `{ type: spatial, axis: z }`. **At most one per record**, since it is the only spatial axis a
    record ever declares.
  - `location` for a column identifying a place, such as an admin or station code. It is a key
    rather than an axis of space, and serializes as an Additional Dimension. Any number are allowed,
    so composite keys such as `adm0_code` + `adm2_code` still work.
- **Breaking:** `dimensions[].type` must be lowercase (`^[a-z][a-z0-9_-]*$`), and the aliases
  `time`, `times`, `date`, `dates`, `datetime`, and `timestamp` are rejected. `temporal` is the only
  spelling that produces a time axis, so a typo now fails validation instead of silently serializing
  as a domain axis. `temporal`, `spatial`, and `bands` are documented as reserved values; anything
  else names a domain axis after what it varies.
- `bands` is no longer suggested as a `dimensions[].type`. The datacube extension has no band
  dimension type - a multi-band file's bands are `variables[]`, serializing as `cube:variables` and
  `raster:bands` - so the value was advertising something that does not exist. It is still accepted
  as an ordinary axis name for a resource that genuinely varies along what it calls a band.
- Added `unit` to `dimensions[]`, mapping to `cube:dimensions[].unit`, which the datacube extension
  defines on every dimension flavour while CDH carried it only on `variables[]`. Needed on a `z`
  dimension (`cm`, `m`, `hPa`); it is not a substitute for `reference_system`, and a `z` dimension
  may carry both.
- **Breaking:** classification class values are restricted to a string or an integer, where any
  number or boolean was previously accepted.
- `series` is now a program, initiative, or product brand grouping whose members are heterogeneous
  by design - one series can hold climate, population, and production datasets at once. It is a
  discovery facet, so filtering by series must keep its members individually listed and filterable,
  and it is explicitly not a product family: that relationship is catalog position (section 4.8)
  plus `processing[].derived_from`.
- Cross-field rules that a schema keyword can express moved out of `scripts/validate-yaml.js` and
  into the published schema: `temporal` `date` versus `start_date`/`end_date` exclusivity, the
  reserved CDH vocab schemes on `keywords[]`, and the `rel: license` link required alongside a
  `LicenseRef-*` expression. Third-party validators now enforce them without this repository's
  scripts. The script keeps only what a schema cannot state - value comparisons, name cross-
  references between arrays, per-property uniqueness, and the SPDX expression grammar.
- On a templated (`href_template`) entry, `file_size` describes one generated file rather than the
  whole set; omit it where slices differ materially in size instead of averaging them.
- The mapping documents (`mapping-stac.md`, `mapping-ogc-records.md`, `crosswalk.md`) are now
  explicitly informative. `standard.md` is normative, a record is validated against the schema and
  never against a mapping, and routing language that read as a requirement has been removed. Whether
  non-spatial records are also encoded as STAC, to keep one format across the catalog, is written up
  as an open question in `mapping-stac.md` section 1.1.

### Fixed

- `$schema` no longer appears in the validator's stray-field report; it is permitted through
  `patternProperties` rather than `properties`.
- The kitchen-sink example declared an `int8` variable under an asset-level `nodata: -9999`, a value
  that type cannot hold. The variable is now `uint8` with its own `nodata: 255`.

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

[Unreleased]: https://github.com/CGIAR-Climate-Data-Hub/cdh-metadata-standard/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/CGIAR-Climate-Data-Hub/cdh-metadata-standard/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/CGIAR-Climate-Data-Hub/cdh-metadata-standard/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/CGIAR-Climate-Data-Hub/cdh-metadata-standard/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/CGIAR-Climate-Data-Hub/cdh-metadata-standard/releases/tag/v0.0.1
