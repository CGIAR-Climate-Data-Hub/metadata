# Authoring guide

This guide is designed to help authors create and submit useful and valid records to the Climate
data hub. This includes which fields are always required, which ones are conditionally required
depending on the submission type, and what the fields mean. Is expected that most records will be
refined and finalized during review, so mistakes and purposeful omissions are expected and should
not prevent or delay submission.

The formal standard is `standard.md`. Fillable YAML starting points live in `../templates/`; each
CDH template declares the CDH profile in `$schema` and binds YAML-aware editors to the same profile
(`schemas/profiles/cdh.schema.json` = the core plus all CDH extensions) for autocomplete and field
hints in code editors (VScode, positron, Neovim, etc.). Teams wanting to customize the metadata
standard for other projects can modify and generate a new profile and declare their own schema URL.

## Key Questions a Record Should Answer

- What is this resource?
- What can it be used for?
- Who produced or maintains it?
- How should it be cited?
- What are the reuse limitations and license?
- Where can the data, code, or documentation be found?
- What geography and time period does it cover?
- What variables, units, dimensions, or classes does it contain?
- What limitations or caveats does it have?

## The bare minimum

Start with enough metadata for someone to find, understand, cite, and access the resource without
opening the files.

Fill these first:

- `id`
- `title`
- `description`
- `resource_type`
- `cdh.domain`
- `keywords`
- `license`, as all CDH resources must be licensed
- `contact` with at least one contact as the `licensor` in `roles`
- `citation` of how the resource should be cited
- `data` with at least one entry and url

Then add the sections that apply to the resource. Note that a minimum record is often not synonymous
with a complete or valid record, and fields such as `variables` will be needed to answer the core
questions above.

## Required Fields

### `id`

A short, stable, URL-safe identifier.

Use lowercase words with hyphens:

```yaml
id: banana-climate-risk-indicators
```

Generally, do not put the version in the `id`; the unversioned `id` always describes the current
release (see [Superseding a record & versioning](#superseding-a-record)).

### `title`

A concise human-readable name.

```yaml
title: Banana Climate Risk Indicators
```

### `description`

A short paragraph or two explaining what the resource is and what it can be used for.

Do not rely on the description for filterable facts, variables, units, etc. Put those facts in the
structured fields provided for them to increase human and machine usability, filtering, and
discovery.

### `resource_type`

What kind of thing the record describes.

Common values:

- `dataset`
- `software` including online tools and dashboards
- `service` such as an API
- `document` such as a report, brief, or paper. Tutorials and guides can also be included, but it is
  likely better for them to be formatted and submitted to the hub as Wikis or Tutorials for better
  visibility.

### `cdh.domain`

The main CDH category used for browsing, filtering, and catalog placement.

Use values from `vocab/domain.json`. Multiple are allowed, but the primary domain first.

```yaml
cdh:
  domain: [agriculture, climate]
```

### `cdh.usage`

This is optional but recommended for datasets. It is intended to direct uses what they can use this
resource for, and any instances where a different dataset should be used instead. Intended uses can
be listed, but they should not be exhaustive. Intended uses should be reasonably broad as to not
limit users if their exact use is not listed. The not recommended for field is also optional but
perhaps more useful to include. It should explicitly lay out uses where this data should not be used
and provide a reason for why. This prevents a user from using the data where it is not appropriate,
while not limiting them to a narrow subset of uses.

Terms and uses such as `research` or `decision-making` are not helpful and should be avoided.

```yaml
cdh:
  usage:
    intended_uses:
      - national and sub-national hotspot mapping
      - targeting of adaptation investment
    not_recommended_for:
      - use: field-scale planting decisions
        reason: the grid is too coarse for field-scale operational decisions.
        use_instead: local survey or administrative production data.
```

### `keywords`

Free-text search terms. Use words people are likely to search for.

Do not repeat values that already have a structured field. Use `keywords` for extra search phrases,
aliases, method names, acronyms, and user-facing terms that are not already captured elsewhere.

Put these in structured fields instead:

| If the term is a...                              | Put it in...                      |
| ------------------------------------------------ | --------------------------------- |
| places, countries, regions, or named geographies | `spatial.geography`               |
| crop, livestock type, or commodity               | `commodities`                     |
| time period (coverage extent)                    | `temporal.*`                      |
| temporal cadence / step                          | `dimensions[]` (`type: temporal`) |

```yaml
keywords:
  - zonal statistics
  - weighted mean
  - climate risk screening
  - growing season
```

#### Linking keywords to an ontology

Link keywords to an external vocabulary where possible. This can help increase the understanding of
the data, particularly for AI-readiness:

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

These make the record reusable and citable. Without a license a dataset is not usable and cannot be
included in the hub. Including a citation ensures the author of the work is acknowledged and it is
properly cited.

Use an SPDX license expression such as `CC-BY-4.0`, `CC0-1.0`, `MIT`, or `CC-BY-4.0 OR CC0-1.0`. A
comprehensive list of license expressions can be found
[on the SPDX website](https://spdx.org/licenses/). If the data is not licensed, a license must be
chosen before submission (see [Choose a License](https://choosealicense.com/) for guidance). For a
custom license, use `LicenseRef-*` and add an `additional_links[]` entry with `rel: license` and a
URL for the license terms.

Use `access_note` when `access` is `restricted` or `non-public`. It should say how to request
access, what authentication is needed, or whether the data is embargoed. In `additional_links[]`,
link to request forms with `rel: create-form`; link access help pages or `mailto:` contacts with
`rel: help`.

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
    organization: IITA
    roles: [processor]
    email: jane.doe@example.org
```

If `name` is used, include `organization` too. `organization` on its own is OK. Roles: `licensor`,
`producer`, `processor`, `point-of-contact`, or `custodian` (the party accountable for the resource
and its metadata - typically whoever authored or submitted the record and maintains it). Contacts
are allowed to list multiple roles.

For `citation`, provide structured fields - `authors` and `date` (required), plus optional `title`,
`publisher`, and `url`. You may omit `citation` when a `doi` is provided, as fields can be derived.

### `created` and `updated`

These timestamps are optional when authoring - provide them if you want, or leave them out and they
are filled in at publication. If updating a resource, please provide a new `updated` date.

### `data`

At least one link to the resource. It is understood that sometimes the resource may need to be
uploaded to the climate data hub before this can be filled. As such, the url can be a placeholder
for the upload location or be left blank to be filled in on final review. Embargoed or restricted
data should still include a link, such as a request page, an embargoed dataverse entry, etc.

```yaml
data:
  - name: primary-data
    locations:
      - url: https://example.org/data.parquet
    description: Primary Parquet table
    media_type: application/vnd.apache.parquet
```

Each asset's `locations` lists access paths to the same content. The first is the primary access
pattern (most often an https url). Alternate locations can be provided if applicable, such as if the
same file is hosted on multiple storage platforms. Data in different formats (csv, parquet) or
services (such as an API or GEE asset) should be listed as separate `data` entries.

Every asset needs a `name`, and names must be unique across both `data` and `additional_assets`. Use
`nodata` when an asset has a sentinel value for missing or invalid observations. When `processing`
contains multiple steps, use `processing_steps` to list the step IDs that apply to a particular data
asset, in processing order:

```yaml
data:
  - name: suitability-cog
    locations:
      - url: https://example.org/suitability.tif
    nodata: -9999
    processing_steps: [source, calculate-suitability]
```

If you know the media type or file size, please provide it. If either value is missing it will need
to be added during final review.

#### How to handle many files with `href_template`

When one dataset is split into many files along dimensions (e.g. hive partitioned parquets or cogs
with 1 file per crop), use one `data[]` entry with `href_template`. You should not need to hand-list
every file.

With a template, `locations[].url` are treated as base paths and the template is appended to each:

```yaml
data:
  - name: cogs
    locations:
      - url: https://data.cdh.org/crop-information/cogs/ # base; first is canonical (use HTTPS)
        title: HTTPS
      - url: s3://cdh/crop-information/cogs/
        title: S3
    href_template: "{crop}_{system}_suitability.tif"
    media_type: "image/tiff; application=geotiff; profile=cloud-optimized"
```

In the above example, the full paths would look something like:

- `https://data.cdh.org/crop-information/cogs/maize_irrigated_suitability.tif`
- `https://data.cdh.org/crop-information/cogs/maize_rainfed_suitability.tif`
- `https://data.cdh.org/crop-information/cogs/bean_irrigated_suitability.tif`
- `https://data.cdh.org/crop-information/cogs/cassava_rainfed_suitability.tif`

Rules:

- Using `href_template` for multiple files
  requires[Variables and dimensions](#variables-and-dimensions) to also be declared.
- Each `{token}` must match a declared `dimensions[].name`, except the `{variable}` token, which
  expands over `variables[].name` for files split per variable.
- The matching dimension's `values` (or the variable names) are substituted verbatim and must match
  file-name tokens.
- Every token dimension must list `values`
- The template assumes every value combination exists.
- Each file URL is `locations[0].url` + filled template; additional locations become alternates.
- Without `href_template`, `locations[].url` are full file URLs.
- A templated entry shares one `description`, `nodata`, `media_type`, and `file_size` across every
  generated file; split into separate `data[]` entries (e.g. one per variable) when those differ.
  `file_size` is the size of a single generated file, not the set - omit it where slices differ
  materially in size rather than averaging them.

Only the file-partitioning dimensions go in the template. Dimensions stored inside each file (e.g.
bands of a multi-band COG) stay out of it.

## Additional fields (Conditional/Optional)

Some fields in the template will not apply to every record. This includes things like `climate`,
`commodities`, `classes`, and `variables`/`dimensions`. Only fill the ones that apply. However,
additional does not always mean optional. If it applies to a dataset, it should be used. Most
datasets will be required to provide a list of variables, for example.

This schema can be extended if a dataset requires additional metadata that is not currently covered.
This should be done by contacting the team, or creating a new third-party extension and adding a
pinned schema URL to `extensions[]`. See `standard.md` section 4.2 and
[`extending.md`](extending.md).

### Spatial

Use `spatial` when the resource has geographic coverage or geospatial assets.

Common fields:

- `spatial.bbox`
- `spatial.geography`
- `spatial.crs`
- `spatial.geometry_column`
- `spatial.resolution`

`spatial.bbox` is a single bounding box, or a list of bounding boxes, in WGS84 (EPSG:4326).

Bounding box coordinate order is:

- 2D: `[west, south, east, north]` = `[xmin, ymin, xmax, ymax]`
- 3D: `[west, south, min_z, east, north, max_z]` (elevation in metres)

Use a flat bounding box for one extent. Use a list only for **disjoint** coverage (separate areas
with a large gap), listing each real area in any order.

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
# or
spatial:
  bbox:
    - [5.9, 47.3, 15.0, 55.1] # Germany
    - [-75.6, -55.9, -66.4, -17.5] # Chile
```

`spatial.geography` is the named-place facet for browse and filtering (the precise footprint lives
in `spatial.bbox`). Use ids from `vocab/geography.json`, a controlled list built from UN M49. M49
includes regions and countries: `[sub-saharan-africa]`, `[eastern-africa]`, `[kenya, uganda]`, or
`[world]`. List all applicable geographies in the dataset, preferring the highest level of coverage.
If `geography` is `[eastern-africa]`, it can be assumed that all east African countries are included
in the dataset fully. If this is not the case, each country should be listed. There is no need to
repeat coverage with children in a parent region. For example, listing the parent is sufficient, not
`[eastern-africa, kenya, uganda, ...]`.

`spatial.crs` should be a coordinate reference system (CRS) identifier, such as `EPSG:4326`.

Use `spatial.resolution` for the spatial unit at which values are represented. For regular grids
(most common case), use `type: xy` when x/y spacing is the same:

```yaml
spatial:
  resolution:
    - type: xy
      value: 0.08333333333333333
      unit: degree
      label: 5 arc-minutes
```

For polygon reporting units such as counties or watersheds:

```yaml
spatial:
  resolution:
    - type: polygon
      value: 2
      unit: admin-level
      label: Counties
      reference_system: GAUL24
```

Use `spatial.geometry_column` when a vector/table asset contains an embedded geometry column which
needs to be read.

### Temporal

Use `temporal` when the resource has a time period, forecast period, projection period, or recurring
observations. It is expected that most datasets will have a temporal field, either a time range of
when observatations took place, a single point in time, or actual time steps.

Common fields:

- `temporal.date`
- `temporal.start_date`
- `temporal.end_date`

`temporal` describes the coverage extent only. Use `date` for a single instant or reference period.
Use `start_date` and `end_date` for a span, with `end_date: null` for an open-ended series. Do not
combine `date` with `start_date` or `end_date`.

These fields can be precise to the year (_e.g._ `date: "1981"`), month (_e.g._ `date: "1981-01"`),
day (_e.g._ `date: "1981-01-01"`), or datetime (_e.g._ `date: "1981-01-01T00:00:00"`).

```yaml
temporal:
  date: "2020"
```

For a range:

```yaml
temporal:
  start_date: "1981-01-01"
  end_date: "2020-12-31"
```

Temporal cadence (daily, monthly, projection periods) should be declared as a `type: temporal`
dimension with an ISO 8601 `step` (see [Variables and dimensions](#variables-and-dimensions)).

```yaml
temporal:
  start_date: "1981-01-01"
  end_date: "2020-12-31"
dimensions:
  - name: time
    type: temporal
    description: Daily time step.
    step: P1D
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
- It is preferable to have unit as a UCUM or UDUNITS-2 unit.
- Include the normal reading guidance in `description` when direction matters.
- Use `note` for variable-specific limitations, caveats, or warnings.

#### Dimensions

Use `dimensions` when variables depend on additional axes such as scenario, model, crop, technology,
band, etc. Time dimension is already covered by `temporal` metadata field.

Define coded values. If a code is not obvious, explain it in the dimension description, point to a
controlled vocabulary, or link a sidecar code list as an [additional asset](#additional-assets).

### Classes

Use `classes` for categorical values, classified rasters, etc.

For long class lists, link a sidecar file instead of putting everything in the record (see
[additional assets](#additional-assets)).

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

Use `climate` fields only when the resource is climate-related or was generated using climate data,
and the field applies.

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

### Additional assets

Use `additional_assets` for supporting files that accompany the primary data, such as documentation,
previews, schemas, QA/QC output, code lists, thumbnails, or runnable examples. Different formats of
the data may also be listed here when they are supplementary rather than a primary way of accessing
the resource.

Like entries in `data`, every additional asset needs a unique `name` and at least one location. Use
multiple `locations` only when they provide different ways to access the same file; use separate
asset entries for different files.

For `additional_assets`, provide `media_type` and `file_size` when known.

`roles` is open; the suggested values are `metadata`, `validation`, `describedby`, `thumbnail`,
`overview`, `visual`, and `example`. Use `example` for a runnable usage example - worth adding when
consuming the data needs a query that the data itself cannot carry, such as a required join:

```yaml
additional_assets:
  - name: join-example
    roles: [example]
    media_type: application/x-ipynb+json
    description: Joins the table to admin-2 boundaries and maps the result.
    locations:
      - url: https://example.org/examples/join-admin2.ipynb
  - name: classes
    roles: [metadata, describedby]
    media_type: text/csv
    description: class codes for the dataset.
    locations:
      - url: https://example.org/rasterClasses.csv
```

### Additional links

Use `additional_links` for related web resources rather than downloadable files: for example,
documentation pages, license terms, request forms, services, or related and source datasets. Each
link needs a unique `name`, a `url`, and a `rel` value describing its relationship to the record.

Common `rel` values include `describedby` for documentation, `license` for license terms,
`create-form` for an access-request form, `help` for access instructions, `cite-as` for the
preferred citation target, and `derived_from` for a source dataset. See `standard.md` section 6 for
the full list.

```yaml
additional_links:
  - name: access-request
    rel: create-form
    url: https://example.org/request-access
    description: Form for requesting access to the dataset.
```

## Where The Record Lives

Put the record in a directory named for the resource. Superseded snapshots sit beside it. When a
representation exists only because of that resource - an admin-level aggregation, a point
extraction, a convenience reformat nobody would look for on its own - give it a subdirectory, and it
becomes a child you can enter from the parent:

```text
example-crop-suitability/
  example-crop-suitability.yaml
  example-crop-suitability-v1.yaml
  admin2/
    example-crop-suitability-admin2.yaml
```

Nothing is inherited. Each record still states its own `license`, `contact`, `citation`, `spatial`,
and `temporal`, even where the parent repeats it word for word - the position only adds navigation
links, and a child still records `processing[].derived_from` if it was derived from its parent.

If the thing has standing of its own - its own DOI, its own funding, inputs from several products -
it is not a child. Give it its own directory and link it with `derived_from`. Do not group by theme
or program either: a subject area is `cdh.domain` and a program is `series`, and both stay filters
rather than folders. See `standard.md` section 4.8.

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
`additional_assets`, a sidecar file, or an extension (see `standard.md` section 4.2).

## Practical Authoring Order

1. Fill the minimum record.
2. Add `spatial` and `temporal` if relevant.
3. Add `variables` and `dimensions`, and include units and reading guidance.
4. Add `classes` only if they are needed to understand values.
5. Add `processing` for derived products.
6. Add `climate` and `commodity` fields when they improve discovery.
7. Add sidecars or extra links for long supporting detail.

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
