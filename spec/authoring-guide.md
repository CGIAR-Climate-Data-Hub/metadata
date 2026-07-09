# Authoring guide

This guide is to help in filling out metadata records: what to write first, what can wait, and where
detail is needed.

The formal standard is `standard.md`. Fillable YAML starting points live in `../templates/`; each
CDH template declares the CDH profile in `$schema` and binds YAML-aware editors to the same profile
(`schemas/profiles/cdh.schema.json` = the core plus all CDH extensions) for autocomplete and field
hints. Other profiles should declare their own profile schema URL; core-only records may omit
profile-specific fields.

## The Short Version

Start with enough metadata for someone to find, understand, cite, and access the resource without
opening the files.

Fill these first:

- `id`
- `title`
- `description`
- `resource_type`
- `cdh.domain`
- `keywords`
- `license`
- `contact` with at least one `licensor` in `roles`
- `citation`
- `created`
- `updated`
- `data`

Then add only the sections that apply to the resource.

## What The Record Should Answer

A useful record answers:

- What is this resource?
- What can it be used for?
- Who produced or maintains it?
- How should it be cited?
- What license applies?
- Where can the data, code, or documentation be found?
- What geography and time period does it cover?
- What variables, units, dimensions, or classes does it contain?
- What sources and processing created it?
- What limitations or caveats matter?

## Minimum Record

Use this as the first pass.

```yaml
"$schema": https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.1.0/schemas/profiles/cdh.schema.json
cdh_schema_version: "v0.1.0"
id: ""
title: ""
description: ""
resource_type: ""
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.1.0/extensions/cdh/schema.json
keywords: []
license: ""
contact:
  - organization: ""
    roles: [licensor]
    email: ""
    url: ""
citation:
  authors: []
  date: ""
# created / updated are optional - filled in at publication if omitted.
cdh:
  domain: []
data:
  - name: ""
    locations:
      - url: ""
    description: ""
    media_type: ""
```

## Required Fields

### `id`

A short, stable, URL-safe identifier.

Use lowercase words with hyphens:

```yaml
id: banana-climate-risk-indicators
```

Do not put the version in the `id`; the unversioned `id` always describes the current release (see
[Superseding a Record](#superseding-a-record)).

### `title`

A concise human-readable name.

```yaml
title: Banana Climate Risk Indicators
```

### `description`

One short paragraph explaining what the resource is and what it can be used for.

Do not rely on the description for filterable facts. Put those facts in the structured fields too.

### `resource_type`

What kind of thing the record describes.

Common values:

- `dataset`
- `software`
- `service`
- `ai-skill`
- `document`

### `cdh.domain`

The main CDH category used for browsing, filtering, and catalog placement.

Use values from `vocab/domain.json`. Put the primary domain first.

```yaml
cdh:
  domain: [agriculture, climate]
```

### `keywords`

Free-text search terms. Use words people are likely to search for.

Do not repeat values that already have a structured field. Use `keywords` for extra search phrases,
aliases, method names, acronyms, and user-facing terms that are not already captured elsewhere.

Put these in structured fields instead:

| If the term is a...                              | Put it in...        |
| ------------------------------------------------ | ------------------- |
| places, countries, regions, or named geographies | `spatial.geography` |
| crop, livestock type, or commodity               | `commodities`       |
| time period or temporal resolution               | `temporal.*`        |

```yaml
keywords:
  - zonal statistics
  - weighted mean
  - climate risk screening
  - growing season
```

#### Linking keywords to an ontology

Link keywords to an external vocabulary when useful:

```yaml
keywords:
  - zonal statistics
  - term: Food security
    scheme: https://www.eionet.europa.eu/gemet/
    uri: https://www.eionet.europa.eu/gemet/en/concept/1838
    description: Availability of food and access to it.
```

Plain-string keywords stay full-text-only. Both forms can be mixed in the same list.

### `license`, `contact`, and `citation`

These make the record reusable and citable.

Use an SPDX license expression such as `CC-BY-4.0`, `CC0-1.0`, `MIT`, or `CC-BY-4.0 OR CC0-1.0`. For
a custom license, use `LicenseRef-*` and add an `additional_links[]` entry with `rel: license` and a
URL for the license terms.

Use `access_note` when `access` is `restricted` or `non-public`. It should say how to request
access, what authentication is needed, or whether the data is embargoed. Link request forms with
`rel: create-form`; link access help pages or `mailto:` contacts with `rel: help`.

For `contact`, use either an organization contact or a person contact. Every record must include at
least one contact with `licensor` in `roles`; that contact is the licensing party for the resource.

Organization contact:

```yaml
contact:
  - organization: Alliance of Bioversity International and CIAT
    roles: [licensor]
    url: https://alliancebioversityciat.org/
```

Person contact:

```yaml
contact:
  - name: Jane Doe
    organization: CGIAR
    roles: [processor]
    email: jane.doe@example.org
```

If `name` is used, include `organization` too. `organization` on its own is OK. Roles: `licensor`,
`producer`, `processor` (STAC provider roles), `point-of-contact` (a contact point), or `custodian`
(the party accountable for the resource and its metadata - typically whoever authored or submitted
the record and maintains it); the latter two map to the Contacts extension. `roles` is an array, so
one contact may hold several.

For `citation`, provide structured fields - `authors` and `date` (required), plus optional `title`,
`publisher`, and `url`. You may omit `citation` when a `doi` is provided.

### `created` and `updated`

These timestamps are optional when authoring - provide them if you want, or leave them out and they
are filled in at publication. Serialized records always include both.

### `data`

At least one link to the resource.

```yaml
data:
  - name: primary-data
    locations:
      - url: https://example.org/data.parquet
    description: Primary Parquet table
    media_type: application/vnd.apache.parquet
```

Each asset's `locations` lists access paths to the **same content**. The first is canonical. Put
different formats or services in separate `data` entries.

If you know the media type or file size, provide it. If either value is missing it will be added
during CDH review.

#### Generating many files with `href_template`

When one dataset is split into many files along dimensions (e.g. hive partitioned parquets or cogs
with 1 file per crop), use one `data[]` entry with `href_template`. Do not hand-list every file.

With a template, `locations[].url` are treated as **base paths** and the template is appended to
each:

```yaml
data:
  - name: cogs
    locations:
      - url: https://data.cdh.org/crop-yield/cogs/ # base; first is canonical (use HTTPS)
        title: HTTPS
      - url: s3://cdh/crop-yield/cogs/
        title: S3
    href_template: "crop_yield_{crop}_{system}_{variable}.tif"
    media_type: "image/tiff; application=geotiff; profile=cloud-optimized"
```

Rules:

- Each `{token}` must match a declared `dimensions[].name`, except the reserved `{variable}` token,
  which expands over `variables[].name` for files split per variable. `variable` cannot be used as a
  dimension name.
- The matching dimension's `values` (or the variable names) are substituted verbatim and must match
  file-name tokens.
- Every token dimension must list `values`; continuous axes such as `lat` / `lon` cannot be tokens.
- The template assumes every value combination exists.
- Each file URL is `locations[0].url` + filled template; additional locations become alternates.
- Without `href_template`, `locations[].url` are full file URLs and the entry stays one asset.
- A templated entry shares one `description`, `nodata`, and `media_type` across every generated
  file; split into separate `data[]` entries (e.g. one per variable) when those differ.

Only the file-partitioning dimensions go in the template. Dimensions stored inside each file (e.g.
bands of a multi-band COG) stay out of it.

## Add These Only When They Apply

Some of these are extension fields - `climate`, `commodities`, `classes`, and
`variables`/`dimensions`. The CDH template already declares them in `extensions[]`, so you only fill
the ones that apply. `spatial`, `temporal`, `processing`, and the asset fields are core and always
available.

For a third-party extension, add its pinned schema URL to `extensions[]`. If the record uses a
profile, set `$schema` to that profile's canonical schema URL and bind it for editor hints. See
`standard.md` section 4.3 and [`extending.md`](extending.md).

### Spatial

Use `spatial` when the resource has geographic coverage or geospatial assets.

Common fields:

- `spatial.bbox`
- `spatial.geography`
- `spatial.structure`
- `spatial.crs`
- `spatial.geometry_column`
- `spatial.resolution`

Use `spatial.structure` when the record describes spatial data. Omit it for non-spatial records and
records that are only tagged with named places through `spatial.geography`.

```yaml
spatial:
  structure: grid
  geography: [world]
```

```yaml
spatial:
  structure: indexed
  geography: [kenya]
  resolution:
    - type: polygon
      label: Counties
      reference_system: GAUL ADM2
```

Use `structure: grid` for gridded, raster, or multidimensional array data; `structure: geometry`
when the asset contains geometries; and `structure: indexed` when rows are keyed to external spatial
features or locations. File formats still belong in `data[].media_type`.

`spatial.bbox` is a single bounding box, or a list of bounding boxes, in WGS84 (EPSG:4326).

Bounding box coordinate order is:

- 2D: `[west, south, east, north]` = `[xmin, ymin, xmax, ymax]`
- 3D: `[west, south, min_z, east, north, max_z]` (elevation in metres)

Use a flat bounding box for one extent. For multiple bounding boxes, use a list and put the overall
extent first. Add sub-boxes only when the union would otherwise leave a large uncovered area.

When converting from common tools, watch the axis order. Here is a comparison across several tools +
stac:

| From                     | Output order               | CDH bbox                     |
| ------------------------ | -------------------------- | ---------------------------- |
| R `terra::ext(r)`        | `xmin, xmax, ymin, ymax`   | `[xmin, ymin, xmax, ymax]`   |
| R `sf::st_bbox(x)`       | `xmin, ymin, xmax, ymax`   | `[xmin, ymin, xmax, ymax]`   |
| Python `rasterio.bounds` | `left, bottom, right, top` | `[left, bottom, right, top]` |
| GDAL `gdalinfo` corners  | `ulx, uly, lrx, lry`       | `[ulx, lry, lrx, uly]`       |
| STAC `bbox`              | `xmin, ymin, xmax, ymax`   | `[xmin, ymin, xmax, ymax]`   |

```yaml
spatial:
  bbox: [-180.0, -90.0, 180.0, 90.0] # whole Earth
```

```yaml
spatial:
  bbox:
    - [-180.0, -90.0, 180.0, 90.0] # overall extent
    - [-10.0, 10.0, 10.0, 20.0] # included sub-region
```

`spatial.geography` is the named-place facet for browse and filtering (the precise footprint lives
in `spatial.bbox`). Use ids from `vocab/geography.json`, a controlled list built from UN M49. M49
includes regions and countries: `[sub-saharan-africa]`, `[eastern-africa]`, `[kenya, uganda]`, or
`[world]`. There is no `global`.

If `spatial.bbox` or `spatial.crs` is omitted for a geospatial STAC record, the CDH review process
will add it. Provide these fields when you know them, especially for multi-asset records or when the
first asset is not representative.

Use `spatial.resolution` for the spatial spacing or unit at which values are represented. For
regular grids, use `type: xy` when x/y spacing is the same:

```yaml
spatial:
  structure: grid
  resolution:
    - type: xy
      value: 0.08333333333333333
      unit: degree
      label: 5 arc-minutes
      reference_system: EPSG:4326
```

For polygon reporting units such as counties or watersheds:

```yaml
spatial:
  structure: indexed
  resolution:
    - type: polygon
      value: 2
      unit: admin-level
      label: Counties
      reference_system: GAUL24
```

Use `spatial.geometry_column` when a vector/table asset contains an embedded geometry column.

### Temporal

Use `temporal` when the resource has a time period, forecast period, projection period, or recurring
observations.

Common fields:

- `temporal.start_date`
- `temporal.end_date`
- `temporal.resolution`

Use `temporal.resolution.step` for the machine-readable time step when known (ISO 8601 durations
such as `P1D`, `P1M`, or `P1Y`). If not known, this will be added during CDH review. Use `values`
for named or easily interpretable temporal positions.

```yaml
temporal:
  start_date: "1981-01-01"
  end_date: "2020-12-31"
  resolution:
    values: []
    unit: daily
    step: P1D
    note: ""
```

### Variables and dimensions

Use `variables` when the resource has measurements, bands, columns, indicators, or other named data
values.

```yaml
variables:
  - name: heat_stress_days
    dimensions: [time, scenario]
    description: >
      Number of days during the growing period when daily maximum temperature exceeded the heat
      stress threshold. Higher values indicate greater heat hazard.
    data_type: float32
    unit: day
    note: >
      This indicator describes temperature stress only and does not represent full crop impact.
```

For each variable:

- Use `description` for what the variable measures.
- Include the normal reading guidance in `description` when direction matters.
- Use `note` for variable-specific limitations, caveats, or warnings.
- Use the record-level `note` for dataset-wide limitations.

Review may add technical details from inspectable files. It cannot infer meaning, units,
interpretation, or caveats.

#### Dimensions

Use `dimensions` when variables depend on additional axes such as scenario, model, crop, technology,
band, etc. Time dimension is already covered by `temporal` metadata field.

Define coded values. If a code is not obvious, explain it in the dimension description, point to a
controlled vocabulary, or link a sidecar code list.

### Classes

Use `classes` for categorical values, class maps, bitfields, or classified rasters.

For long class lists, link a sidecar file instead of putting everything in the record.

### Processing

Use `processing` for derived products, generated datasets, or resources where source data and
methods matter.

Keep it concise. A single `source` step is enough for simple records.

```yaml
processing:
  - id: source
    description: >
      Daily climate data were aggregated to GAUL admin2 zones and summarized as baseline and
      future-period indicators.
    code:
      url: https://github.com/example-org/climate-risk-pipeline
      version: 0f3ac9d # Commit hash but could also be version tag
    date: 2026-04-21
    derived_from:
      - title: NEX-GDDP-CMIP6
        url: https://example.org/nex-gddp-cmip6
```

### Climate Fields

Use `climate` fields only when the resource is climate-related and the field applies.

Possible Fields:

- `climate.scenarios`
- `climate.models`
- `climate.mip_era`
- `climate.baseline`
- `climate.bias_adjustment`
- `climate.downscaling`

### Commodities

Use `commodities` for agriculture, food-systems, livestock, and crop resources.

Use values from `vocab/commodity.json`.

### Additional Assets and Links

Use these for supporting files, documentation, previews, schemas, QA/QC output, code lists,
alternate formats, or services.

For `additional_assets`, provide `media_type` and `file_size` when known. Review may add them from
inspectable files.

## Superseding a Record

When a new release of the data ships, snapshot first, then update in place:

1. Copy the current record to a new file. Append the version to the snapshot's `id` (e.g.
   `spam2020-v2`) and set `deprecated: true`. Never edit the snapshot again.
2. Update the original record to the new release: set the new `version` and point `previous_version`
   at the snapshot's `id`.

The unversioned `id` always describes the current release. Metadata-only fixes are not releases -
update in place without a snapshot. See `standard.md` section 4.7 for the full rules.

## What Review Cannot Decide

Review may fill technical facts from inspectable assets. Authors provide:

- `title`
- `description`
- `license`
- `citation`
- `cdh.domain`
- `commodities`
- `climate.*`
- variable meaning, units, reading guidance, and caveats
- whether a record should be published

## What To Leave Out

Leave a field out when:

- It does not apply to the resource.
- The value would only repeat another field.
- The information is unknown and not required.
- The detail belongs in a sidecar file because it is long, nested, or likely to change.

Avoid inventing new fields. If the template has no place for something, use `additional_links`,
`additional_assets`, a sidecar file, or an extension (see `standard.md` section 4.3).

## Practical Authoring Order

1. Fill the minimum record.
2. Add `spatial` and `temporal` if relevant.
3. Add `variables`, and include units and reading guidance.
4. Add `dimensions` or `classes` only if they are needed to understand values.
5. Add `processing` for derived products.
6. Add climate and commodity fields when they improve discovery.
7. Add sidecars or extra links for long supporting detail.
8. Review the record using the checklist in `standard.md`.

## Quick Review

Before publishing, check:

- The title and description are understandable without opening the data.
- Search and filter facts are in structured fields, not only prose.
- Variables have units and plain-language meaning.
- Important caveats are in `note`.
- Data, code, documentation, citation, and license links are stable.
- Optional fields are omitted when they do not apply.

## Validation Checklist

### Required for every record

- [ ] `cdh_schema_version`
- [ ] `$schema`
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
- [ ] `deprecated: true` on version snapshots
- [ ] `doi` when a DOI exists
- [ ] `processing[]` for derived products
- [ ] `commodities[]` for commodity-specific resources
- [ ] `climate.scenarios[]` for projection-based climate resources
- [ ] `climate.mip_era` for CMIP-based resources
- [ ] `climate.baseline` for anomalies and baseline-relative indicators
- [ ] `classes[]` or class sidecar for classified data
