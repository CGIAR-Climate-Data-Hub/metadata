# Climate Data Hub Metadata Standard

Status: v0.2.0

This document defines the metadata model used by the Climate Data Hub - the field definitions,
requirement levels, and rules every Hub record conforms to. The model is self-contained and stands
on its own, independent of any output format. It is designed to be flexible and extensible for other
projects and programs. It is intend to map to commonly used community formats, namely:

- **STAC** - for geospatial data. See [`mapping-stac.md`](./mapping-stac.md).
- **OGC API Records** (recordJSON) - for everything else: non-spatial datasets, documents, software,
  services. See [`mapping-ogc-records.md`](./mapping-ogc-records.md).

For the field-level mapping to both formats, see [`crosswalk.md`](./crosswalk.md). Fillable YAML
templates live in [`templates/`](../templates/), including
[`full-standard.yaml`](../templates/full-standard.yaml).

For contributor-facing guidance, start in [`authoring-guide.md`](./authoring-guide.md).

> [!NOTE] For now, all metadata submissions must be in CDH YAML format which will be automatically
> converted to STAC or OGC API Records. In the future, there may be an option to directly submit
> STAC or OGC API Records.

## 1. Purpose

A Hub record exists to make a resource:

- **Discoverable** by humans, AI agents, and other tools.
- **Understandable** without opening the underlying files.
- **Citable** with a stable identifier and reference.
- **Validatable** against a schema.
- **Usable** without manual interpretation.

Free text helps, but structured facts belong in structured fields.

## 2. Versioning

The CDH metadata standard, schemas, controlled vocabularies, and extensions are versioned together.
A single git tag (`v<MAJOR>.<MINOR>.<PATCH>`) covers all of them. `cdh_schema_version` in input YAML
records matches the same tag.

For now, there is no independent extension version. This may change with increased use of the
extensions. Published URLs follow the pattern `<base>/<TAG>/...`.

## 3. Requirement Levels

The standard follows RFC 2119-style requirement levels.

| Level       | Meaning                                     |
| ----------- | ------------------------------------------- |
| Required    | Metadata is invalid without this field.     |
| Recommended | Strongly expected unless not applicable.    |
| Conditional | Required only for certain resource classes. |
| Optional    | Useful, but not required.                   |

The schema rejects blank values (`""`, `null`, empty required lists). Omit unknown values. The only
allowed `null` is an open-ended `temporal` interval. Files under `templates/` validate in draft mode
so blank placeholders do not weaken the published schema.

## 4. Authoring Rules

### 4.1 Structured fields first

Each fact about the resource is recorded in the most structured place available, in this order:

1. **A core or CDH extension field** (section 5) when one fits.
2. **A linked sidecar metadata asset** (`rel=describedby`) for large, nested, or changing detail.
3. **A custom extension field** (see section 4.2) when no standard placement fits.
4. **Free-text inside `description`**, as a last resort, when the fact cannot be structured.

### 4.2 Extending the schema

CDH metadata is a generic core plus optional extensions. Validation has two layers:

- **Mechanism:** core plus exactly the extensions declared in `extensions[]`. Fields from undeclared
  extensions are rejected.
- **Profile:** policy rules on top. The CDH profile requires the `cdh` extension and composes the
  five CDH-maintained extensions: `cdh`, `climate`, `datacube`, `classification`, and `agriculture`
  (section 5.5).

Records may declare their validation schema in the top-level `$schema` field. The core schema
accepts any schema URI and does not require a profile-specific value. Profiles can make `$schema`
required and constrain it to their own canonical schema URL. The CDH profile accepts its schema URL
for any released version - the record's `cdh_schema_version` names the release it targets - so
existing records stay valid when a new version is released. The CDH templates set `$schema` and also
bind the same profile for editor hints. A bundled copy (`cdh.schema.bundled.json`) is published for
validators that need a single schema file.

To carry metadata the standard does not yet cover:

1. Use a field from an existing CDH extension if one fits.
2. Add a field to a CDH extension when it is broadly useful. Update the schema, profile, crosswalk,
   and examples before use.
3. Author a new extension for project- or center-specific fields. Start from
   [`extensions/_template/`](extensions/_template/README.md); see [`extending.md`](./extending.md).

A new extension SHOULD nest fields under one top-level key named after the extension. The older
`datacube`, `classification`, and `agriculture` extensions keep their existing top-level fields.
Fields that outlive one project should move into a shared extension.

### 4.3 Description, note, and free text

`description` and `note` are first-class fields, not catch-all fallbacks:

- **`description` (required)** explains the resource.
- **`note` (optional)** is for caveats, warnings, or interpretation-critical remarks.

Search, filter, facet, and programmatic facts MUST be structured fields, not only prose.

### 4.4 Domain vs keywords

`cdh.domain` and `keywords` serve different purposes.

- **`cdh.domain` (required, closed vocab)** - the CDH-controlled high-level classification used for
  structured browse, filtering, grouping, and STAC sub-catalog placement. Values come from
  `vocab/domain.json`. See the [CDH extension](extensions/cdh/README.md).
- **`keywords` (required, open)** - discovery terms for full-text search. Each entry is either a
  plain string OR a linked object `{ term, scheme, uri, description? }` pointing the term at an
  external vocabulary or ontology (e.g., AGROVOC, GEMET). Linked entries are emitted as themes;
  plain strings are full-text only.

Decision rule:

- A value needed for filter / group-by / catalog browse -> `cdh.domain`.
- A value with an external ontology concept -> linked entry in `keywords`.
- A value useful only for full-text search -> plain string in `keywords`.

### 4.5 Sidecar metadata

Use sidecar files (linked with `rel=describedby`) for large, nested, or frequently changing content
such as long code lists, full [variable dictionaries](extensions/datacube/README.md), QA/QC outputs,
detailed table schemas, and detailed [classification legends](extensions/classification/README.md).

### 4.6 Author-supplied vs review-inferred

Review MAY add technical facts readable from the asset: `media_type`, `file_size`, `spatial.bbox`,
`spatial.crs`, and variable `data_type` / `nodata` / `dimensions`. Authors SHOULD provide them when
known. Fields such as descriptions, units, reading guidance, caveats, license, citation, remain the
author's responsibility.

### 4.7 Versioning a resource

Use this rule when a resource changes:

- **Metadata fix or enrichment** (typo, better description, added contact) - update the existing
  record in place. `updated` reflects the revision.
- **Routinely extended time series** (e.g., a monthly-updated observation product) - same record;
  use an open-ended `temporal` interval. This is not a version.
- **New/updated data format** (e.g., new file format, updated chunk structure, re-compressed) -
  update the existing record with any additional urls and update the processing code commit/version.
- **New release of the data** (values change, new time span or coverage, new DOI or citation) -
  snapshot, then update in place. Copy the current record to a new record whose `id` appends the
  version (e.g. `spam2020-v2`) and set `deprecated: true` on the snapshot. Then update the original
  record to the new release: set the new `version` and point `previous_version` at the snapshot's
  `id`. The unversioned `id` always describes the current release. Snapshots are frozen - never edit
  them again.
- **Structural change or lossy transform** (dimension added or removed, resolution or extent change,
  aggregation, reclassification) - a distinct resource, not a version. Create a separate record
  linked through `processing[].derived_from`.

Author the chain backward only: each new record points at its predecessor.

`previous_version` only points at Hub records. A predecessor that was never catalogued is
provenance, not a version chain - use `processing[].derived_from` or a `via` link. A resource
superseded by something outside the Hub can carry an `additional_links[]` entry with
`rel: successor-version`; a changelog can be linked with `rel: version-history`.

## 5. Field Reference

The fields below are defined by the core schema (`schemas/core.schema.json`) and the CDH extensions
(section 5.5, declared in `extensions[]`). For each field: **Requirement**, **Definition**,
**Expected value**, **Rules**, **Vocabulary** where applicable, and **Example**.

### 5.1 Record and core fields

#### `$schema`

- **Requirement:** Optional in the core schema; required by the CDH profile.
- **Definition:** The canonical JSON Schema URL for validating this metadata record.
- **Expected value:**
  - Core-only records: any profile or schema URI, when present.
  - CDH profile records: the CDH profile schema URL for the release the record targets, e.g.
    `https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.2.0/schemas/profiles/cdh.schema.json`.
    Any released version is accepted; the version segment must match `cdh_schema_version`.
- **Rules:**
  - The version segment of every CDH-hosted schema URL in the record (`$schema` and `extensions[]`)
    must match `cdh_schema_version`, so a record references one release throughout. Validators
    enforce this as a cross-field rule.
  - Identifies the validation schema or profile. Continue using `extensions[]` for the extension
    schemas the record uses.

#### `cdh_schema_version`

- **Requirement:** Required
- **Definition:** The version of the CDH standard this record targets.
- **Expected value:** The release tag, `v<MAJOR>.<MINOR>.<PATCH>` (see section 2).
- **Example:** `v0.2.0`

#### `id`

- **Requirement:** Required
- **Definition:** A persistent, unique identifier for the metadata record.
- **Expected value:** Short, stable, URL-safe string.
- **Rules:**
  - Must be unique in the Hub catalog.
  - Must be lowercase.
  - Must not contain `/`, `:`, `?`, `#`, `&`, spaces, or other URL/path-reserved characters.
  - Should use hyphens, not underscores.
  - Should not change when the title changes.
  - Must not include the version; the unversioned `id` always identifies the current release. Only
    deprecated snapshots append the version (e.g. `spam2020-v2`). See section 4.7.
- **Example:** `spam2020`

#### `title`

- **Requirement:** Required
- **Definition:** Short, human-readable title for the resource.
- **Expected value:** Concise string.
- **Rules:**
  - Must clearly describe the resource.
  - Should not end with punctuation.
  - Should not include the file format unless central to the resource.
- **Example:** `Global Crop Yield 2020 v2`

#### `description`

- **Requirement:** Required
- **Definition:** Human-readable description of the resource.
- **Expected value:** One short paragraph.
- **Rules:**
  - Must say what the resource is and what it can be used for.
  - Should mention geography, time period, variables, scenarios, hazards, or commodities when
    relevant.
  - Should be understandable without opening the data files.
  - Should avoid unexplained acronyms.
  - Must not be a copy of the title.
  - Must not be the only place where filterable facts are stored.

#### `note`

- **Requirement:** Optional
- **Definition:** Free-text caveats, warnings, or interpretation-critical remarks that a reader of
  `description` alone could miss.
- **Encodes as:** `cgiar-cdh:note`.
- **Rules:**
  - Must not duplicate `description`.
  - Must not be used as a second free-form description.
  - Should be omitted when nothing important is at stake - empty notes add noise.
  - Use when there is a genuine caveat (e.g., known artifact, data version mismatch, restricted
    geographic validity, sensitive aggregation behavior).

#### `license`

- **Requirement:** Required
- **Definition:** Legal terms under which the resource may be used.
- **Expected value:** Valid SPDX license expression.
- **Vocabulary:** [SPDX License List](https://spdx.org/licenses/).
- **Rules:**
  - Use SPDX identifiers and expressions such as `CC-BY-4.0`, `CC0-1.0`, or `CC-BY-4.0 OR CC0-1.0`.
  - Custom licenses must use an SPDX `LicenseRef-*` expression and include an `additional_links[]`
    entry with `rel: license` and a URL for the license terms.
  - Data must be licensed to be included in the Hub.
  - Access restrictions are separate from license (see `access`).
- **Examples:** `CC-BY-4.0`, `CC0-1.0`, `MIT`, `LicenseRef-CGIAR-Restricted`.

#### `access`

- **Requirement:** Optional. Defaults to `public` when omitted.
- **Definition:** Access condition for the data, separate from reuse terms in `license`.
- **Vocabulary:** Closed set, aligned to the DCAT / EU accessRights vocabulary:
  - `public` - openly accessible; the data can be obtained directly.
  - `restricted` - discoverable, but obtaining the data requires a request or authentication (e.g.
    contact the producer, or credentialed/presigned access).
  - `non-public` - catalogued, but not available through public channels.
- **Rules:**
  - Omit (or set `public`) for openly accessible data.
  - An embargo (data not yet released) is `restricted`, not a separate value.
  - For `restricted` / `non-public`, provide `access_note`.
  - Use `additional_links[].rel: create-form` for access request forms and `rel: help` for access
    help pages or `mailto:` contacts.
- **Example:** `restricted`

#### `access_note`

- **Requirement:** Required when `access` is `restricted` or `non-public`.
- **Definition:** Human-readable access conditions or instructions, including embargo details,
  request steps, authentication requirements, or why the data is catalogued but unavailable.
- **Encoding:** Maps to schema.org `conditionsOfAccess`; maps to `cgiar-cdh:access_note` in STAC and
  OGC Records.
- **Examples:**
  - `Embargoed until 2027-01-01. Contact the data custodian for early access.`
  - `Request access using the linked form. Approval is limited to research use.`

#### `resource_type`

- **Requirement:** Required
- **Definition:** Kind of resource the record describes.
- **Vocabulary:** Closed set defined in `vocab/resource_type.json`. Initial values are `dataset`,
  `software`, `service`, and `document`.
- **Rules:**
  - Should not replace asset media types.

#### `extensions[]`

- **Requirement:** Required. The CDH profile requires it to include the `cdh` extension.
- **Definition:** Pinned schema URLs of the extensions the record uses.
- **Rules:**
  - The record is validated against the core composed with exactly these extensions (see section
    4.2); fields from an undeclared extension are rejected.
  - The CDH template pre-lists the CDH-maintained extensions; authors rarely edit this by hand.

#### `keywords`

- **Requirement:** Required
- **Definition:** Search terms, optionally linked to an external vocabulary.
- **Expected value:** List of items. Each item is either:
  - a plain string (full-text discovery term), or
  - an object `{ term, scheme, uri, description? }` where:
    - `term` (required) - human-readable label,
    - `scheme` - resolvable URI of the source vocabulary/ontology (e.g., AGROVOC, GEMET),
    - `uri` - resolvable URI of the specific concept within `scheme`,
    - `description` - optional human-readable definition.
- **Rules:**
  - Include method names, acronyms, aliases, project terms, and other search phrases not already
    captured by structured fields.
  - Must not replace structured fields such as `resource_type`, `cdh.domain`, `commodities`,
    `climate.*`, `spatial.*`, `temporal.*`, or `variables[]`.
  - Do not duplicate structured values. Geography belongs in `spatial.geography`; commodities in
    [`commodities`](extensions/agriculture/README.md); scenarios, models, baselines, and MIP eras in
    [`climate.*`](extensions/climate/README.md); variables, bands, indicators, and columns in
    [`variables[]`](extensions/datacube/README.md).
  - Filter/group-by values belong in `cdh.domain`, not here. See section 4.4.
  - Should use consistent spelling and capitalization.
  - Linked items must include both `scheme` and `uri` to be expanded as themes; a `term`-only object
    is equivalent to a plain string.
  - Do not link entries to the
    `https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/vocab/*` schemes - those are
    reserved for encoder expansion from `cdh.domain` and `commodities`.

Authoring YAML:

```yaml
keywords:
  - zonal statistics
  - weighted mean
  - term: Food security
    scheme: https://www.eionet.europa.eu/gemet/
    uri: https://www.eionet.europa.eu/gemet/en/concept/1838
    description: Availability of food and access to it.
```

#### `created`, `updated`

- **Requirement:** Required in serialized records; optional in input YAML.
- **Definition:** Date the metadata record was created / last updated.
- **Expected value:** ISO 8601 / RFC 3339 date or datetime.
- **Rules:**
  - `updated` must be ≥ `created`.
  - Refers to the metadata record, not the underlying dataset.
  - Authors MAY provide these; when omitted, they are filled in at publication. Serialized records
    MUST include both values.

#### `version`, `previous_version`, `deprecated`

- **Requirement:** Conditional. Required when the resource is versioned; `previous_version` is
  required when the record supersedes an existing Hub record; `deprecated: true` is required on
  version snapshots.
- **Expected value:** Stable version label; `deprecated` is boolean.
- **Rules:**
  - Identify the resource version, not the metadata schema version.
  - Semantic versions, release names, years, source versions, or commit hashes are all acceptable.
  - `previous_version` is the `id` of the predecessor record. See section 4.7 for when to snapshot
    and what the encoder derives from the chain.
  - `deprecated: true` marks a superseded snapshot. Snapshots are frozen and are surfaced only
    through the version chain, not catalog listings.

#### `series`

- **Requirement:** Optional
- **Expected value:** `{ name, url }`; `name` is required.
- **Rules:**
  - Groups records that belong to one dataset series or product family (e.g., MapSPAM, GLW, Africa
    Agriculture Adaptation Atlas), independent of the version chain.
  - `name` is the grouping key: use the exact same spelling on every record in the series.
  - `url` is the series landing page, when one exists.
  - A series is not a version chain (section 4.7) and not provenance (`processing[].derived_from`).
    A record derived from a series member belongs to its own series, if any.

### 5.2 Contact and Citation

#### `contact[]`

- **Requirement:** Required. At least one contact MUST list `licensor` in `roles`.
- **Expected value:** List of objects with `name`, `roles`, `email`, `organization`, `url`.
- **Vocabulary for `roles`:** `licensor`, `producer`, `processor`, `point-of-contact`, and
  `custodian`. The first three are STAC provider roles; `point-of-contact` and `custodian` map to
  the Contacts extension instead. A `custodian` is the party accountable for the resource and its
  metadata - typically the person who authored or submitted the record and maintains it. `roles` is
  an array, so one contact may hold several (e.g., `[producer, licensor]`).
- **Rules:**
  - Must identify at least one responsible party.
  - Must identify at least one licensing party by including `licensor` in `roles`.
  - A `licensor` contact is the party that holds or administers the right to license the resource.
  - Each contact MUST include `roles` and `organization`.
  - Use `organization` on its own for organization-level contacts when no specific person should be
    named.
  - Use `name` plus `organization` for person-level contacts.
  - Email, URL, or org contact page when public.

#### `citation`

- **Requirement:** Required unless a `doi` is provided (a DOI resolves to full citation metadata).
- **Definition:** Structured citation for the resource.
- **Expected value:** Object with `authors` and `date` (both required), and optional `title`,
  `publisher`, `url`.
- **Rules:**
  - Cite the resource described by the record, not only a source dataset.
  - `authors` is an ordered list of name strings.
  - `title` defaults to the record's top-level `title`; set it only when the cite-as title differs.
  - `publisher` holds the data publisher/repository for datasets, or the journal for articles.

#### `doi`

- **Requirement:** Conditional. Required when a DOI exists; a DOI also satisfies the citation
  requirement on its own.
- **Expected value:** Bare DOI (e.g. `10.7910/DVN/SWPENT`), not a URL. The resolvable
  `https://doi.org/…` link is built downstream.

#### `related_publications[]`

- **Requirement:** Optional
- **Expected value:** List of `{ citation, doi }`, where `citation` is the same structured object. A
  `doi` alone is sufficient for an entry.

#### `funding[]`

- **Requirement:** Optional
- **Expected value:** List of `{ name, url }`.

### 5.3 Spatial

Required when the resource has a geospatial footprint. `spatial.geography` (named places) applies to
any resource for broad discovery; `bbox`, `crs`, `resolution`, and `geometry_column` describe a
precise footprint.

#### `spatial.bbox`

- **Expected value:** A single bounding box, or a list of boxes, in WGS84 decimal degrees
  (EPSG:4326). Each box lists all axes of the southwesterly-most corner first, then all axes of the
  northeasterly-most corner:

  - 2D: `[west, south, east, north]` (= `[xmin, ymin, xmax, ymax]`).
  - 3D: `[west, south, min_z, east, north, max_z]` (= `[xmin, ymin, zmin, xmax, ymax, zmax]`);
    elevation in metres.

  Single-region datasets use a flat box, e.g. `[-180, -90, 180, 90]`. For **disjoint** coverage
  (separate areas with a large gap between them), pass a list of boxes (`[[...], [...]]`), each a
  real area covered, in any order. Do not author an overall/union box - the encoder derives it when
  serializing (STAC, for example, wants the union as the first extent entry).

- **Rules:**
  - Coordinates MUST be in WGS84 regardless of `spatial.crs` (which describes the underlying assets,
    not the bbox).
  - Longitude is constrained to `[-180, 180]` and latitude to `[-90, 90]`; the schema rejects
    out-of-range values.
  - Bbox arrays MUST have length 4 or 6 - other lengths are rejected.
- **Authoring note:** Provide `spatial.bbox` when known, especially for multi-asset records or when
  the first asset is not representative; otherwise review may add it (see section 4.6).

##### Common-tool mappings

The order is (`xmin, ymin, xmax, ymax`), not the "min-min-max-max-per-axis" order produced by R's
`terra::ext()` or GDAL's `-projwin`. Translate carefully - see the tool-by-tool conversion table in
the [authoring guide](./authoring-guide.md#spatial).

##### Examples

```yaml
spatial:
  bbox: [-180.0, -90.0, 180.0, 90.0] # whole Earth, 2D
```

```yaml
spatial:
  bbox: [-180.0, -90.0, -1, 180.0, 90.0, 0] # whole Earth, -1m to 0m (i.e. soil data...)
```

```yaml
spatial:
  bbox: # disjoint coverage; no overall/union box - the encoder derives it
    - [5.9, 47.3, 15.0, 55.1] # Germany
    - [-75.6, -55.9, -66.4, -17.5] # Chile
```

#### `spatial.geography`

- **Requirement:** Optional
- **Definition:** Named geographies for broad discovery, browse, and filtering.
- **Expected value:** List of concept ids from `vocab/geography.json`.
- **Vocabulary:** `vocab/geography.json` - a controlled list generated from the UN M49 standard. It
  covers the full hierarchy (World, regions, sub-regions, intermediate regions, and countries). Each
  concept carries its M49 `code`, an `iso3` code (countries), `parents` (ancestor ids, for roll-up
  filtering), and LDC/LLDC/SIDS `groups`.
- **Rules:**
  - Must use the `id` from the `vocab/geography.json` vocabulary.
  - Complements `bbox`; one does not replace the other.
- **Examples:** `[world]`, `[sub-saharan-africa]`, `[kenya, uganda]`.

#### `spatial.crs`

- **Requirement:** Conditional. Required for geospatial STAC assets.
- **Expected value:** EPSG code (e.g., `EPSG:4326`), CRS URI, or PROJ string for custom CRS.
- **Vocabulary:** [EPSG codes](https://epsg.io/).
- **Authoring note:** Provide `spatial.crs` when known; otherwise review may add it (see section
  4.6).

#### `spatial.resolution`

- **Requirement:** Conditional. Required when the spatial unit or spacing is needed to interpret the
  data (e.g., regular grids, point observations, or polygon reporting units).
- **Expected value:** List of `{ type, value, unit, label, reference_system, note }`.
- **Rules:**
  - `type` is required, and is one of `xy`, `x`, `y`, `point`, or `polygon`.
  - **Exactly one spatial characterization per record:** either a single entry, or an `x` + `y` pair
    when grid spacing differs. No other combination is valid - a grid entry never sits beside a
    `point` / `polygon` entry.
  - Use `type: xy` for regular grids with the same x/y spacing.
  - A representation of the same data at a different spatial resolution (e.g. polygon aggregates
    extracted from a grid) is a **separate record** linked by `derived_from`, not a second entry
    here. Resolution is record-level, never per asset.
  - For grid entries (`xy`, `x`, `y`), `value` + `unit` describe grid spacing and map to STAC
    Datacube dimension `step` + `unit`.
  - For point or polygon entries, use `label` and `reference_system` to describe the observation
    locations or reporting units. `value` + `unit` may be used when a meaningful level exists, such
    as `value: 2`, `unit: admin-level`.
  - `label` is the human-readable form (e.g., `5 arc-minutes`, `Kenya counties`).
  - `note` is for short spatial interpretation notes that do not belong in the record-level `note`.

#### `spatial.geometry_column`

- **Requirement:** Conditional. For vector tables with an embedded geometry column.
- **Expected value:** Name of the geometry column.
- **Encoding:** STAC Table Extension `table:primary_geometry`.

### 5.4 Temporal

Required when the resource has temporal coverage. `temporal` records the coverage **extent only** -
temporal cadence is not stored here (see "Temporal cadence" below).

#### `temporal.date`, `temporal.start_date`, `temporal.end_date`

- **Expected value:** ISO 8601 at any precision - year (`2020`), month (`2020-06`), day
  (`2020-06-23`), or an instant (`2020-06-23T00:00:00Z`). Nothing looser is accepted.
- **Rules:**
  - Use `date` for a single instant or period, or `start_date` + `end_date` for a span. They are
    **mutually exclusive**, and this maps 1:1 onto STAC:

    | Meaning                  | Encoding                        | STAC                            |
    | ------------------------ | ------------------------------- | ------------------------------- |
    | Single instant or period | `date`                          | `datetime`                      |
    | Span                     | `start_date` + `end_date`       | `start_datetime`/`end_datetime` |
    | Open-ended series        | `start_date` + `end_date: null` | open interval                   |

  - **Precision states the granularity.** `date: 2020` is the whole year 2020 (a static reference
    year); `date: 2020-06-23T10:00:00Z` is an instant. To say "all of 2020" you write `2020`, not
    `2020-01-01`.
  - **A reduced-precision `end_date` is inclusive through the end of its period** (`end_date: 2010`
    means through 2010-12-31). Starts expand to the beginning of the period, which naive parsing
    already does; only ends need the end-of-period expansion. Encoders apply this when serializing.

#### Temporal cadence

Temporal cadence (daily, monthly, seasonal, projection periods, ...) is **not** a `temporal` field.
Express it as a `type: temporal` dimension in the datacube extension, with an ISO 8601 `step` - one
dimension per temporal axis, and a cube may have several (e.g. `season` within 20-year `period`s).
This mirrors `spatial`: the horizontal grid comes from `spatial`, and every other axis - time and
domain - is a `dimensions[]` entry. See the [datacube extension](extensions/datacube/README.md).

### 5.5 Extension fields

CDH extension fields are declared in `extensions[]` and validated with the core (see section 4.2).
Each extension is documented alongside its schema (linked below); all are optional except the `cdh`
extension, which the CDH profile requires (`cdh.domain`). Encode values you filter or facet on in
these extension fields, not in `keywords` (see section 4.4).

| Extension                                             | Fields                                                 | Applies to                            |
| ----------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| [CDH](extensions/cdh/README.md)                       | `cdh.domain`, `cdh.not_recommended_for`                | all records (required by the profile) |
| [Climate](extensions/climate/README.md)               | `climate.*` - scenarios, models, baseline, downscaling | climate / CMIP / adaptation           |
| [Datacube](extensions/datacube/README.md)             | `dimensions[]`, `variables[]`                          | gridded / multidimensional / tabular  |
| [Classification](extensions/classification/README.md) | `classes[]`                                            | categorical / classified data         |
| [Agriculture](extensions/agriculture/README.md)       | `commodities[]`                                        | agriculture / food-systems / crops    |

### 5.6 Processing and Provenance

#### `processing[]`

- **Requirement:** Recommended - required for derived products.
- **Definition:** Ordered list of processing steps. When present, one step MUST use `id: source`.
- **Expected value per step:** `{ id, description, code: { url, version }, date, derived_from[] }`.
- **Rules:**
  - `id` must be unique within `processing[]`.
  - At least one step must use `id: source` whenever `processing[]` is present.
  - `derived_from[]` entries are external `{ url, title }` references. When the source is versioned,
    point `url` at the version-specific URL (e.g. a snapshot record or versioned landing page), not
    at a URL that tracks the latest release. Step order is the array order; asset-specific chains
    use `data[].processing_steps[]`.
  - `date` is ISO 8601 / RFC 3339.
  - Put `source` first unless the processing order requires otherwise.

### 5.7 Assets and Links

#### `data[]`

- **Requirement:** Required - at least one entry.
- **Expected value per entry:**
  `{ name, locations, description, media_type, file_size, nodata, processing_steps }`.
- **Vocabulary:** `media_type` must be an
  [IANA media type](https://www.iana.org/assignments/media-types/) (e.g.,
  `application/vnd.zarr; version=3`, `image/tiff; application=geotiff; profile=cloud-optimized`).
- **`locations[]`:** Access location(s) for the asset. Required for at least one entry. Each entry
  is `{ url, title? }`, where `title` is an optional access label describing the access path (e.g.,
  `HTTPS`, `S3`), not the content.
  - The first entry is canonical.
  - List more than one entry only when the additional entries point at the same content via a
    different access path (e.g., an HTTPS and an S3 URL for the same file). All `locations[]` share
    the asset's `media_type`, `file_size`, and `nodata`.
  - Different content, formats, or services are separate `data[]` / `additional_assets[]` entries.
- **`href_template` (optional):** Use when one dataset is split into many files along its dimensions
  (e.g., one COG per crop, production system, and variable). Each `locations[].url` becomes a base
  path with the template appended. Each `{token}` must match a `dimensions[].name`, or be the
  reserved `{variable}` token, which expands over `variables[].name` for files split per variable
  (`variable` is therefore not allowed as a dimension name). The entry serializes as one item per
  combination of the tokens' values. Values are substituted verbatim; every combination is assumed
  to exist. Omit it for a single file. See the
  [authoring guide](./authoring-guide.md#generating-many-files-with-href_template).
- **Rules:**
  - `name` is required; it becomes the asset key in serialized output and must be unique across
    `data[]` and `additional_assets[]`.
  - `locations[].url` must point to the described resource and should be stable.
  - For restricted resources, `locations[].url` should point to a landing page or access
    instructions.
  - Provide `media_type` and `file_size` when known; otherwise review may add them (see section
    4.6).
  - `processing_steps` references `processing[].id` values.

#### `additional_assets[]`

- **Requirement:** Recommended
- **Definition:** Non-primary assets (QA/QC, code lists, schemas, thumbnails, alternate formats,
  additional metadata files).
- **Expected value per entry:** `{ name, locations, description, media_type, roles, file_size }`.
- **`locations[]`:** Same shape and rules as `data[].locations` - required, at least one entry;
  first is canonical; multiple entries only for the same content via a different access path.
- **Vocabulary for `roles`:** `metadata`, `validation`, `describedby`, `thumbnail`, `overview`,
  `visual`.
- **Rules:** Same as `data[]`.

#### `additional_links[]`

- **Requirement:** Optional
- **Expected value per entry:** `{ name, rel, url, description }`.
- **Vocabulary for `rel`:** See section 6.

## 6. Link Relations

| rel                                             | Use                                       | Source               |
| ----------------------------------------------- | ----------------------------------------- | -------------------- |
| `self`, `root`, `parent`, `child`, `collection` | Catalog navigation                        | IANA / STAC / OGC    |
| `cite-as`                                       | Preferred citation target (DOI)           | IANA                 |
| `license`                                       | License terms for the resource            | IANA / STAC          |
| `describedby` / `describes`                     | Documentation, schema, code list          | IANA                 |
| `about`                                         | Project or explanatory page               | IANA                 |
| `create-form`                                   | Form for requesting access or submission  | IANA                 |
| `help`                                          | Access help page or contact               | IANA                 |
| `via`                                           | Intermediate source                       | IANA                 |
| `canonical`                                     | Authoritative URL (when this is a mirror) | IANA                 |
| `alternate`                                     | Alternate representation                  | IANA                 |
| `derived_from`                                  | Source dataset                            | STAC                 |
| `predecessor-version` / `successor-version`     | Version chain (successor side is derived) | IANA                 |
| `latest-version`                                | Current version (derived, on superseded)  | IANA                 |
| `version-history`                               | Changelog or version history document     | IANA                 |
| `enclosure`                                     | Downloadable file (OGC Records)           | IANA                 |
| `service`                                       | Service endpoint                          | IANA                 |
| `license`                                       | License document                          | IANA                 |
| `preview` / `icon` / `thumbnail`                | Imagery                                   | IANA / STAC          |
| `processing-expression`                         | Code or workflow that produced the data   | STAC Processing Ext. |

## 7. Controlled Vocabularies Summary

| Field                                                         | Vocabulary                                                                                                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `license`                                                     | SPDX License List                                                                                                                                                        |
| dates (`created`, `updated`, `temporal.*`, `processing.date`) | ISO 8601 / RFC 3339                                                                                                                                                      |
| `spatial.crs`                                                 | EPSG codes                                                                                                                                                               |
| `spatial.geography`                                           | `vocab/geography.json` (UN M49; regions + countries)                                                                                                                     |
| `variables[].unit`, grid `spatial.resolution[].unit`          | Unit of measurement, preferably UDUNITS-2 or UCUM (not strictly validated); non-grid spatial units may use clear labels such as `admin-level`                            |
| `variables[].name` (climate)                                  | CF Standard Names (where practical)                                                                                                                                      |
| `contact[].roles[]`                                           | `licensor`, `producer`, `processor` (STAC provider roles), `point-of-contact`, `custodian` (Contacts extension)                                                          |
| `media_type`                                                  | IANA media types                                                                                                                                                         |
| `resource_type`                                               | `vocab/resource_type.json`                                                                                                                                               |
| `cdh.domain`                                                  | `vocab/domain.json` (CDH closed set)                                                                                                                                     |
| `keywords[].scheme` (linked items)                            | Open - any resolvable controlled-vocabulary URI (e.g., AGROVOC, GEMET). Do not link entries to `https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/vocab/*`. |
| `commodities`                                                 | `vocab/commodity.json` (AGROVOC-mapped); encoded as themes                                                                                                               |
| `climate.mip_era`                                             | `CMIP5`, `CMIP6` (informal)                                                                                                                                              |
| `climate.scenarios`                                           | SSP / RCP labels, `historic` (informal)                                                                                                                                  |
| `climate.models`                                              | CMIP source IDs (informal)                                                                                                                                               |
