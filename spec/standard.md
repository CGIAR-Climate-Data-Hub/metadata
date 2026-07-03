# Climate Data Hub Metadata Standard

Status: v0.1.0

This document defines the metadata model used by the Climate Data Hub - the field definitions,
requirement levels, and rules every Hub record conforms to. The model is self-contained and stands
on its own, independent of any output format.

Records serialize to one of two formats, chosen automatically (see section 4.1) and designed to
align with established standards:

- **STAC** - for geospatial data. See [`mapping-stac.md`](./mapping-stac.md).
- **OGC API Records** (recordJSON) - for everything else: non-spatial datasets, documents, software,
  services, AI skills. See [`mapping-ogc-records.md`](./mapping-ogc-records.md).

For the field-level mapping to both formats, see [`crosswalk.md`](./crosswalk.md). Fillable YAML
templates live in [`templates/`](../templates/), including
[`full-standard.yaml`](../templates/full-standard.yaml).

For contributor-facing guidance, start in [`authoring-guide.md`](./authoring-guide.md).

> \[!NOTE] For now, all metadata submissions must be in CDH YAML format which will be automatically
> converted to STAC or OGC API Records. In the future, there may be an option to directly submit
> STAC or OGC API Records.

## 1. Purpose

A Hub record exists to make a resource:

- **Discoverable** by humans and tools.
- **Understandable** without opening the underlying files.
- **Citable** with a stable identifier and reference.
- **Validatable** against a schema.
- **Usable** by automated/AI tools without manual interpretation.

Free-text descriptions support these goals, but cannot be the only place where structured,
filterable facts are stored.

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

The schema enforces these levels directly: blank values (`""`, `null`, empty required lists) are
invalid - omit a field rather than leaving it empty. The only meaningful `null` is an open-ended
`temporal` interval. Editor warnings on a partially filled record are expected; they disappear as
fields are filled. Files under `templates/` are validated as drafts (blank placeholders and presence
rules are relaxed), so templates stay checkable without weakening the schema.

## 4. Authoring Rules

### 4.1 Routing

The serialization target is inferred, not author-set: a `dataset` with a spatial footprint
(`spatial.bbox` / geometry) serializes to **STAC**; everything else - non-spatial datasets,
documents, software, services, AI skills - serializes to **OGC API Records**. Inference runs at
encode time, after any review-supplied bbox (see section 4.7).

### 4.2 Structured fields first

Each fact about the resource is recorded in the most structured place available, in this order:

1. **A core or CDH extension field** (section 5) when one fits.
2. **A linked sidecar metadata asset** (`rel=describedby`) when the content is large, nested, or
   frequently changing. Also use this to link other metadata files that do not fit the standard,
   such as a dataset README.
3. **A custom extension field** (see section 4.3) when no standard placement fits.
4. **Free-text inside `description`**, as a last resort, when the fact cannot be structured.

How the encoder places each field in the most native STAC or OGC Records location (core field,
approved extension, or `cgiar-cdh:*`) is covered in `mapping-stac.md` and `mapping-ogc-records.md`.

### 4.3 Extending the schema

CDH metadata is a small, generic **core** plus optional **extensions**. Validation has two layers:

- **Mechanism (always):** a record declares the extensions it uses in `extensions[]` (pinned schema
  URLs) and is validated against the core composed with exactly those declared extensions - a field
  from an extension that is not declared is rejected.
- **Profile (policy):** a profile schema adds house rules on top. The CDH profile
  (`schemas/profiles/cdh.schema.json`) composes the core with all five CDH-maintained extensions -
  `cdh`, `climate`, `datacube`, `classification`, and `agriculture` (section 5.5) - and requires the
  `cdh` extension (it carries `cdh.domain`) on every Hub record. The Hub pipeline supplies the CDH
  profile to the validator exactly as any adopter supplies their own; nothing CDH-specific is built
  into the mechanism.

Templates bind the CDH profile through the `yaml-language-server` modeline for autocomplete and
hints. A single-file bundled copy (`cdh.schema.bundled.json`, all `$refs` inlined) is published for
validation with any JSON Schema tool.

Terminology: **core** and **extension** name the input model; an input **profile** is a policy
schema composing them with house rules. The output encodings have their own profiles - the CDH STAC
profile and the CDH OGC Records profile in the mapping docs.

To carry metadata the standard does not yet cover:

1. Use a field from an existing CDH extension if one fits.
2. Add a field to the relevant CDH extension when it is broadly useful. It must land in the
   extension schema, profile, crosswalk, and examples before use.
3. Author a new extension - your own pinned schema - for project- or center-specific fields, and
   declare it in `extensions[]`. It composes with the core without modifying it. Start from the
   template in [`extensions/_template/`](extensions/_template/README.md); the full walkthrough is in
   [`extending.md`](./extending.md).

A new extension SHOULD nest all of its fields under a single top-level key named after the extension
(as `cdh.*` and `climate.*` do). Validation rejects undeclared fields, and a bare top-level field
risks colliding with a future core field or another extension. The `datacube`, `classification`, and
`agriculture` extensions predate this rule and keep their top-level `dimensions`, `variables`,
`classes`, and `commodities` fields.

A field that outlives one project or center is a sign it should be a shared extension rather than an
ad hoc addition.

How input fields map to STAC/OGC output extensions (including `cgiar-cdh:*`) is a separate concern,
covered in `mapping-stac.md` and `mapping-ogc-records.md`.

### 4.4 Description, note, and free text

`description` and `note` are first-class fields, not catch-all fallbacks:

- **`description` (required)** is the canonical human- and AI-readable paragraph explaining the
  resource.
- **`note` (optional)** is reserved for caveats, warnings, or interpretation-critical remarks that a
  reader of `description` alone would otherwise miss. It is not a second description, and not a
  place to dump prose that did not fit elsewhere. Use `note` only when something important would be
  lost without it.

A fact that is needed for search, filtering, faceting, or programmatic use MUST be encoded as a
structured field, not only mentioned in `description` or `note`. `description` exists to
contextualize structured facts; `note` exists to flag caveats. Neither is the source of truth for
filterable data.

### 4.5 Domain vs keywords

`cdh.domain` and `keywords` are not interchangeable - each serves a different purpose.

- **`cdh.domain` (required, closed vocab)** - the CDH-controlled high-level classification used for
  **structured browse, filter, and group-by** in the catalog UI, and for STAC sub-catalog placement.
  Values are validated against `vocab/domain.json`. This is where the website filter reads from. See
  the [CDH extension](extensions/cdh/README.md).
- **`keywords` (required, open)** - discovery terms for full-text search. Each entry is either a
  plain string OR a linked object `{ term, scheme, uri, description? }` pointing the term at an
  external vocabulary or ontology (e.g., AGROVOC, GEMET). Linked-keyword entries are also expanded
  by the encoder into the serialized record's themes block, grouped by `scheme`. Plain-string
  entries are full-text only and are not emitted as themes.

Decision rule:

- A value needed for filter / group-by / catalog browse -> `cdh.domain`.
- A value with a canonical concept in an external ontology you want to expose for semantic discovery
  -> linked entry in `keywords`.
- A value useful only for full-text search -> plain string in `keywords`.

### 4.6 Sidecar metadata

Use sidecar files (linked with `rel=describedby`) for large, nested, or frequently changing content
such as long code lists, full [variable dictionaries](extensions/datacube/README.md), QA/QC outputs,
detailed table schemas, and detailed [classification legends](extensions/classification/README.md).

### 4.7 Author-supplied vs review-inferred

Technical facts readable from the asset - `media_type`, `file_size`, `spatial.bbox`, `spatial.crs`,
and variable `data_type` / `nodata` / `dimensions` - MAY be added during CDH review when omitted,
where they can be determined from the asset URL, file extension, or inspectable metadata. Authors
SHOULD still provide them when known, especially for multi-asset records. Curatorial facts -
descriptions, units, reading guidance, caveats, license, citation - cannot be inferred and remain
the author's responsibility.

### 4.8 Versioning a resource

What happens when a resource changes depends on what changed:

- **Metadata fix or enrichment** (typo, better description, added contact) - update the existing
  record in place. `updated` reflects the revision.
- **Routinely extended time series** (e.g., a monthly-updated observation product) - same record;
  use an open-ended `temporal` interval. This is not a version.
- **New release of the data** (values change, new time span or coverage, new DOI or citation) - a
  new record with a new `id` (the `id` may include the version, e.g. `spam2020-v2`). Set `version`,
  and set `previous_version` to the predecessor record's `id`.
- **Structural change or lossy transform** (dimension added or removed, resolution or extent change,
  aggregation, reclassification) - a distinct resource, not a version. Create a separate record
  linked through `processing[].derived_from`.

The version chain is authored backward only: each new record points at its predecessor, and
superseded records are never edited. Everything else is derived at encode time from the
`previous_version` graph - superseded records receive `successor-version` and `latest-version` links
and are marked deprecated (STAC Version Extension) in their serialized form.

`previous_version` only points at Hub records. A predecessor that was never catalogued is
provenance, not a version chain - use `processing[].derived_from` or a `via` link. A resource
superseded by something outside the Hub can carry an `additional_links[]` entry with
`rel: successor-version`; a changelog can be linked with `rel: version-history`.

## 5. Field Reference

The fields below are defined by the core schema (`schemas/core.schema.json`) and the CDH extensions
(section 5.5, declared in `extensions[]`). For each field: **Requirement**, **Definition**,
**Expected value**, **Rules**, **Vocabulary** where applicable, and **Example**.

### 5.1 Core

#### `cdh_schema_version`

- **Requirement:** Required
- **Definition:** The version of the CDH standard this record targets.
- **Expected value:** The release tag, `v<MAJOR>.<MINOR>.<PATCH>` (see section 2).
- **Example:** `v0.1.0`

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
  - Should not include version unless each version is a separate record.
- **Example:** `spam2020-v2`

#### `title`

- **Requirement:** Required
- **Definition:** Short, human-readable title for the resource.
- **Expected value:** Concise string.
- **Rules:**
  - Must clearly describe the resource.
  - Should not end with punctuation.
  - Should not include the file format unless central to the resource.
- **Example:** `MAPSPAM 2020 v2`

#### `description`

- **Requirement:** Required
- **Definition:** Human- and AI-readable description of the resource.
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
- **Expected value:** SPDX identifier preferred; recognized license name or clear custom statement
  otherwise.
- **Vocabulary:** [SPDX License List](https://spdx.org/licenses/).
- **Rules:**
  - Prefer SPDX identifiers.
  - Data must be licensed to be included in the Hub.
  - Access restrictions are separate from license (see `access`).
- **Examples:** `CC-BY-4.0`, `CC0-1.0`, `MIT`.

#### `access`

- **Requirement:** Optional. Defaults to `public` when omitted.
- **Definition:** Access condition for the resource's data, distinct from `license` (which sets
  reuse terms, not who may obtain the data).
- **Vocabulary:** Closed set, aligned to the DCAT / EU accessRights vocabulary:
  - `public` - openly accessible; the data can be obtained directly.
  - `restricted` - discoverable, but obtaining the data requires a request or authentication (e.g.
    contact the producer, or credentialed/presigned access).
  - `non-public` - catalogued for discovery but not available through public channels.
- **Rules:**
  - Omit (or set `public`) for openly accessible data.
  - An embargo (data not yet released) is `restricted`, not a separate value.
  - For `restricted` / `non-public` records, the primary `data[].locations[].url` should point at an
    access/request path rather than a dead direct download.
- **Example:** `restricted`

#### `resource_type`

- **Requirement:** Required
- **Definition:** Kind of resource the record describes.
- **Vocabulary:** Closed set defined in `vocab/resource_type.json`. Initial values are `dataset`,
  `software`, `service`, `ai-skill`, and `document`.
- **Rules:**
  - Should not replace asset media types.

#### `extensions[]`

- **Requirement:** Required. The CDH profile requires it to include the `cdh` extension.
- **Definition:** Pinned schema URLs of the extensions the record uses.
- **Rules:**
  - The record is validated against the core composed with exactly these extensions (see section
    4.3); fields from an undeclared extension are rejected.
  - The CDH template pre-lists the CDH-maintained extensions; authors rarely edit this by hand.

#### `keywords`

- **Requirement:** Required
- **Definition:** Free-form search terms, optionally linked to an external controlled vocabulary or
  ontology.
- **Expected value:** List of items. Each item is either:
  - a plain string (full-text discovery term), or
  - an object `{ term, scheme, uri, description? }` where:
    - `term` (required) - human-readable label,
    - `scheme` - resolvable URI of the source vocabulary/ontology (e.g., AGROVOC, GEMET),
    - `uri` - resolvable URI of the specific concept within `scheme`,
    - `description` - optional human-readable definition.
- **Rules:**
  - Should include method names, acronyms, aliases, project-specific terms, or other user-facing
    search phrases that are not already captured by structured fields.
  - Must not replace structured fields such as `resource_type`, `cdh.domain`, `commodities`,
    `climate.*`, `spatial.*`, `temporal.*`, or `variables[]`.
  - Should not duplicate structured values. If a geography exists, encode it in `spatial.geography`;
    if a crop or commodity exists, encode it in [`commodities`](extensions/agriculture/README.md);
    if a scenario, model, baseline, or MIP era exists, encode it in
    [`climate.*`](extensions/climate/README.md); if a variable, band, indicator, or column exists,
    encode it in [`variables[]`](extensions/datacube/README.md).
  - Values used for filter, group-by, or facet belong in `cdh.domain` (closed CDH vocab), not here.
    See section 4.5.
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

#### `version`, `previous_version`

- **Requirement:** Conditional. Required when the resource is versioned; `previous_version` is
  required when the record supersedes an existing Hub record.
- **Expected value:** Stable version label.
- **Rules:**
  - Identify the resource version, not the metadata schema version.
  - Semantic versions, release names, years, source versions, or commit hashes are all acceptable.
  - `previous_version` is the `id` of the predecessor record. See section 4.8 for when to create a
    new versioned record and what the encoder derives from the chain.

### 5.2 Contact and Citation

#### `contact[]`

- **Requirement:** Required. At least one contact MUST list `licensor` in `roles`.
- **Expected value:** List of objects with `name`, `roles`, `email`, `organization`, `url`.
- **Vocabulary for `roles`:** `licensor`, `producer`, `processor`, and `point-of-contact`. The first
  three are STAC provider roles; `point-of-contact` maps to the Contacts extension instead. `roles`
  is an array, so one contact may hold several (e.g., `[producer, licensor]`).
- **Rules:**
  - Must identify at least one responsible party.
  - Must identify at least one licensing party by including `licensor` in `roles`.
  - A `licensor` contact is the party that holds or administers the right to license the resource.
  - Each contact MUST include `roles` and `organization`.
  - Use `organization` on its own for organization-level contacts when no specific person should be
    named.
  - Use `name` plus `organization` for person-level contacts. If `name` is present, `organization`
    is required so the person is not detached from an institutional context.
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

  Single-region datasets use one box, e.g. `[-180, -90, 180, 90]`. To describe sub-regions, pass a
  list of boxes (`[[...], [...]]`) where the first is the overall extent; add more only when their
  union would otherwise leave a large uncovered area (e.g., Germany + Chile). Both forms serialize
  to STAC's array-of-boxes.

- **Rules:**
  - Coordinates MUST be in WGS84 regardless of `spatial.crs` (which describes the underlying assets,
    not the bbox).
  - Longitude is constrained to `[-180, 180]` and latitude to `[-90, 90]`; the schema rejects
    out-of-range values.
  - Bbox arrays MUST have length 4 or 6 - other lengths are rejected.
- **Authoring note:** Provide `spatial.bbox` when known, especially for multi-asset records or when
  the first asset is not representative; otherwise review may add it (see section 4.7).

##### Common-tool mappings

The order is (`xmin, ymin, xmax, ymax`), not the "min-min-max-max-per-axis" order produced by R's
`terra::ext()` or GDAL's `-projwin`. Translate carefully - see the tool-by-tool conversion table in
the [authoring guide](./authoring-guide.md#spatial).

##### Examples

```yaml
spatial:
  bbox:
    - [-180.0, -90.0, 180.0, 90.0] # whole Earth, 2D
```

```yaml
spatial:
  bbox:
    - [-180.0, -90.0, -1, 180.0, 90.0, 0] # whole Earth, -1m to 0m (i.e. soil data...)
```

```yaml
spatial:
  bbox:
    - [-75.6, -55.9, 15.0, 55.1] # overall (Germany + Chile)
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
  - Serves a different purpose from `bbox`, just because one exists does not mean the other doesn't
    need to.
- **Examples:** `[world]`, `[sub-saharan-africa]`, `[kenya, uganda]`.

#### `spatial.crs`

- **Requirement:** Conditional. Required for geospatial STAC assets.
- **Expected value:** EPSG code (e.g., `EPSG:4326`), CRS URI, or PROJ string for custom CRS.
- **Vocabulary:** [EPSG codes](https://epsg.io/).
- **Authoring note:** Provide `spatial.crs` when known; otherwise review may add it (see section
  4.7).

#### `spatial.resolution`

- **Requirement:** Conditional. Required when the spatial unit or spacing is needed to interpret the
  data (e.g., regular grids, point observations, or polygon reporting units).
- **Expected value:** List of `{ type, value, unit, label, reference_system, note }`.
- **Rules:**
  - `type` is one of `xy`, `x`, `y`, `point`, or `polygon`.
  - Use `type: xy` for regular grids with the same x/y spacing.
  - Use separate `type: x` and `type: y` entries only when x/y spacing differs.
  - Do not mix `xy` with `x` / `y` entries in the same record.
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

Required when the resource has temporal coverage.

#### `temporal.start_date`, `temporal.end_date`

- **Expected value:** ISO 8601 / RFC 3339 date or datetime. Use `null` for open-ended intervals.

#### `temporal.resolution`

- **Requirement:** Conditional. Required for time-series, forecast, projection, or
  recurring-observation data.
- **Expected value:** `{ values, unit, step, note }`.
- **Rules:**
  - `values` lists named or easily interpretable temporal positions when useful (e.g.,
    `[1, 2, ..., 12]` for months).
  - `unit` is the author-facing time unit or label (e.g., `day`, `month`, `year`, `daily`,
    `monthly`).
  - `step` is the STAC Datacube-compatible step when known, preferably an ISO 8601 duration such as
    `P1D`, `P1M`, or `P1Y`.
  - `note` explains temporal interpretation or temporal aggregation, such as "daily data aggregated
    to monthly using median".

### 5.5 Extension fields

CDH extension fields are declared in `extensions[]` and validated with the core (see section 4.3).
Each extension is documented alongside its schema (linked below); all are optional except the `cdh`
extension, which the CDH profile requires (`cdh.domain`). Encode values you filter or facet on in
these extension fields, not in `keywords` (see section 4.5).

| Extension                                             | Fields                                                   | Applies to                            |
| ----------------------------------------------------- | -------------------------------------------------------- | ------------------------------------- |
| [CDH](extensions/cdh/README.md)                       | `cdh.domain`, `cdh.use_cases`, `cdh.not_recommended_for` | all records (required by the profile) |
| [Climate](extensions/climate/README.md)               | `climate.*` - scenarios, models, baseline, downscaling   | climate / CMIP / adaptation           |
| [Datacube](extensions/datacube/README.md)             | `dimensions[]`, `variables[]`                            | gridded / multidimensional / tabular  |
| [Classification](extensions/classification/README.md) | `classes[]`                                              | categorical / classified data         |
| [Agriculture](extensions/agriculture/README.md)       | `commodities[]`                                          | agriculture / food-systems / crops    |

### 5.6 Processing and Provenance

#### `processing[]`

- **Requirement:** Recommended - required for derived products.
- **Definition:** Ordered list of processing steps. When `processing[]` is provided, at least one
  step MUST use `id: source` and describe the original generation of the data; for many records this
  is the only step needed.
- **Expected value per step:** `{ id, description, code: { url, version }, date, derived_from[] }`.
- **Rules:**
  - `id` must be unique within `processing[]`.
  - At least one step must use `id: source` whenever `processing[]` is present.
  - `derived_from[]` entries are always external URLs of the form `{ url, title }`. This matches
    STAC `links[rel=derived_from]` semantics. Inter-step references are NOT used here - order in the
    `processing[]` array carries the step sequence, and the chain for a specific asset is captured
    by `data[].processing_steps[]`.
  - `date` is ISO 8601 / RFC 3339.
  - Put the `source` step first unless there is a specific reason to preserve a different processing
    order. Add subsequent steps only when meaningful new processing occurs (e.g., format conversion,
    bias adjustment).

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
  - Different content or formats (e.g., COG vs NetCDF) and services that are queried rather than
    downloaded (e.g., a Google Earth Engine collection) are separate assets - a separate `data[]` or
    `additional_assets[]` entry, not an extra location here.
- **`href_template` (optional):** Use when one dataset is split into many files along its dimensions
  (e.g., one COG per crop, production system, and variable). Each `locations[].url` becomes a base
  path with the template appended; each `{token}` must match a `dimensions[].name` (so the record
  must declare the `datacube` extension), and the entry serializes as one item per combination of
  those dimensions' `values` instead of a single asset. Values are substituted verbatim and every
  combination is assumed to exist. Omit it for a single file. Expansion mechanics and an example are
  in the [authoring guide](./authoring-guide.md#generating-many-files-with-href_template).
- **Rules:**
  - `name` is required; it becomes the asset key in serialized output and must be unique across
    `data[]` and `additional_assets[]`.
  - `locations[].url` must point to the described resource and should be stable.
  - For restricted resources, `locations[].url` should point to a landing page or access
    instructions.
  - Provide `media_type` and `file_size` when known; otherwise review may add them (see section
    4.7).
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
| `describedby` / `describes`                     | Documentation, schema, code list          | IANA                 |
| `about`                                         | Project or explanatory page               | IANA                 |
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
| `contact[].roles[]`                                           | `licensor`, `producer`, `processor` (STAC provider roles), `point-of-contact` (Contacts extension)                                                                       |
| `media_type`                                                  | IANA media types                                                                                                                                                         |
| `resource_type`                                               | `vocab/resource_type.json`                                                                                                                                               |
| `cdh.domain`                                                  | `vocab/domain.json` (CDH closed set)                                                                                                                                     |
| `keywords[].scheme` (linked items)                            | Open - any resolvable controlled-vocabulary URI (e.g., AGROVOC, GEMET). Do not link entries to `https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/vocab/*`. |
| `commodities`                                                 | `vocab/commodity.json` (AGROVOC-mapped); encoded as themes                                                                                                               |
| `climate.mip_era`                                             | `CMIP5`, `CMIP6` (informal)                                                                                                                                              |
| `climate.scenarios`                                           | SSP / RCP labels, `historic` (informal)                                                                                                                                  |
| `climate.models`                                              | CMIP source IDs (informal)                                                                                                                                               |

## 8. Validation Checklist

### Required for every record

- [ ] `cdh_schema_version`
- [ ] `id`, `title`, `description`
- [ ] `created`, `updated` (filled in at publication if omitted)
- [ ] `resource_type`
- [ ] `cdh.domain[]` includes at least one concept from `vocab/domain.json`
- [ ] `keywords[]`
- [ ] `license`
- [ ] `contact[]` includes at least one contact with `licensor` in `roles`
- [ ] `citation` (or `doi`, which satisfies the citation requirement)
- [ ] `data[]` includes at least one entry

### Required for geospatial records

- [ ] `spatial.bbox` or `spatial.geography`
- [ ] `spatial.crs` for geospatial assets

### Required where applicable

- [ ] `temporal.start_date` / `end_date` for resources with temporal coverage
- [ ] `variables[]` and `dimensions[]` for data-cube or multi-variable data
- [ ] `version` for versioned resources
- [ ] `previous_version` when the record supersedes an existing Hub record
- [ ] `doi` when a DOI exists
- [ ] `processing[]` for derived products
- [ ] `commodities[]` for commodity-specific resources
- [ ] `climate.scenarios[]` for projection-based climate resources
- [ ] `climate.mip_era` for CMIP-based resources
- [ ] `climate.baseline` for anomalies and baseline-relative indicators
- [ ] `classes[]` or class sidecar for classified data
