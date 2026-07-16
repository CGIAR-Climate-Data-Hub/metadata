# CDH to STAC Mapping

Status: draft

This document specifies how a CDH metadata record is encoded as STAC. Field definitions and
requirements live in `standard.md`..

## 1. When to use STAC

Use STAC for resources with spatial, temporal, asset-level, variable-level, or data-cube discovery
needs. Typical cases:

- Rasters, COGs, Zarr, NetCDF, GeoParquet
- Data cubes and gridded climate products
- Spatial vector assets, spatial/temporal tabular assets
- APIs for access to geospatial data

This mapping applies to records routed to STAC: a `dataset` with a spatial footprint (see
`standard.md` section 5.3). Technical spatial fields such as `bbox`, `crs`, `resolution`, and
`geometry_column` route a record to STAC. `spatial.geography` alone is a place facet and does not
make a record spatial data.

## 2. STAC Extensions

The CDH STAC profile uses the following extensions where applicable.

| Extension           | Purpose                                                             |
| ------------------- | ------------------------------------------------------------------- |
| Scientific          | DOI, citation, related publications                                 |
| Datacube            | Variables, dimensions, units, nodata for data cubes and Zarr/NetCDF |
| Raster              | Per-band metadata for COG-style raster assets                       |
| Table               | Columns, row count, primary geometry for tabular assets             |
| Classification      | Class values, labels, descriptions, bitfields                       |
| Projection          | CRS, EPSG code, projection metadata                                 |
| Processing          | Processing datetime, lineage, software                              |
| Contacts            | People and organizations, including point-of-contact roles          |
| Version             | Dataset version, predecessor/successor records                      |
| File                | File size                                                           |
| Alternate Assets    | Mirrors and alternate access paths                                  |
| Themes              | Controlled-vocabulary thematic classification                       |
| **CDH (cgiar-cdh)** | Hub-specific approved fields not covered by the above               |

## 3. Native-fields-first rule

Encode each field in the most standard place available:

1. Core STAC field (`id`, `title`, `description`, `license`, `keywords`, `created`, `updated`,
   `providers`, `extent`, …)
2. A STAC Extension field from the table above
3. An approved `cgiar-cdh:*` field
4. A sidecar metadata asset linked with `rel=describedby`
5. Free-text `description` or `cgiar-cdh:note`

Searchable structured facts MUST NOT live only in free text.

## 4. Field-by-field placement

### 4.1 Core

| CDH                         | STAC placement                                                                                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                        | `id`                                                                                                                                                                                                                                  |
| `title`                     | `title`                                                                                                                                                                                                                               |
| `description`               | `description`                                                                                                                                                                                                                         |
| `created` / `updated`       | `created` / `updated`                                                                                                                                                                                                                 |
| `keywords`                  | `keywords`                                                                                                                                                                                                                            |
| `license`                   | `license` (SPDX preferred)                                                                                                                                                                                                            |
| `access`                    | `cgiar-cdh:access` (STAC has no native access-rights field). Omitted = `public`; `public` MAY be left unencoded.                                                                                                                      |
| `access_note`               | `cgiar-cdh:access_note`; also suitable for schema.org `conditionsOfAccess` on generated landing pages.                                                                                                                                |
| `contact[]`                 | `providers[]` and contacts extension `contacts[]` for additional contact info. At least one contact must include `licensor` in `roles`, which maps to a `licensor` provider.                                                          |
| `citation`                  | `sci:citation`                                                                                                                                                                                                                        |
| `doi`                       | `sci:doi` and `links[rel=cite-as]`                                                                                                                                                                                                    |
| `related_publications[]`    | `sci:publications[]`                                                                                                                                                                                                                  |
| `note`                      | `cgiar-cdh:note`                                                                                                                                                                                                                      |
| `version`                   | `version` (Version Extension)                                                                                                                                                                                                         |
| `deprecated`                | `deprecated` (Version Extension)                                                                                                                                                                                                      |
| `previous_version`          | `links[rel=predecessor-version]`. The encoder derives the rest of the chain from the `previous_version` graph: superseded records get `links[rel=successor-version]` and `links[rel=latest-version]` (see `standard.md` section 4.7). |
| `funding[]`                 | `cgiar-cdh:funding`                                                                                                                                                                                                                   |
| `series`                    | `cgiar-cdh:series` (`{ name, url }`). `name` is the grouping key for series facets and listings.                                                                                                                                      |
| `cdh.domain[]`              | `cgiar-cdh:domain` on the Collection; also expanded into Themes Extension `themes[]` under the CDH domain scheme. First entry drives sub-catalog placement.                                                                           |
| `keywords[]` (linked items) | Each linked-keyword entry (`{ term, scheme, uri }`) is also emitted as a Themes Extension `themes[]` concept, grouped by `scheme`. Plain-string keywords are emitted only into STAC `keywords`.                                       |
| Themes Extension `themes[]` | Encoder output only - populated from `cdh.domain`, `commodities`, and any linked-keyword entries. Not an author-facing input field.                                                                                                   |

### 4.2 Resource type

STAC implies resource type through object type and asset media types. CDH also emits
`cgiar-cdh:resource_type` for cross-encoding consistency.

### 4.3 Spatial / Temporal

| CDH                                | STAC placement                                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spatial.bbox`                     | `extent.spatial.bbox` (Collection) - the encoder prepends the derived overall/union box as the first entry, then the authored boxes; `bbox` (Item)                |
| `spatial.geography[]`              | `cgiar-cdh:geography` array                                                                                                                                       |
| `spatial.crs`                      | Projection Extension: `proj:code` (preferred) or `proj:epsg`                                                                                                      |
| `spatial.geometry_column`          | Table Extension `table:primary_geometry`                                                                                                                          |
| `spatial.resolution[]`             | Grid entries (`xy`, `x`, `y`) map to `cube:dimensions[].step` (+ `unit`/`reference_system`); all entries also emit as `cgiar-cdh:spatial_resolution`              |
| `temporal.start_date` / `end_date` | `extent.temporal.interval` (Collection); Item `datetime` (instant, `start_date` only) or `start_datetime`/`end_datetime` (span); `end_date: null` = open interval |

Resolution placement, in order of preference:

1. For gridded/array assets, `spatial.resolution[]` entries with `type: xy`, `x`, or `y` are
   expanded to the relevant `cube:dimensions[]` `step`, expressed in that dimension's native `unit`
   / `reference_system`. `type: xy` is an authoring shorthand and serializes as separate x and y
   dimensions.
2. The Collection-level `cgiar-cdh:spatial_resolution` mirrors the input `spatial.resolution[]`
   list. This is the format-independent value for labels, point/polygon reporting units, and
   non-metric spatial units.
3. Temporal cadence is not a resolution field: it comes from a `type: temporal` dimension's `step`
   (see below), which maps to that `cube:dimensions[].step`.

### 4.4 Data fields, dimensions, variables

Array/grid data uses Datacube by default; tabular data uses Table.

- `dimensions[]` -> `cube:dimensions`
- `variables[]` -> `cube:variables`

Each `dimensions[]` entry becomes a `cube:dimensions` member. A `type: temporal` dimension
serializes as a temporal cube dimension, carrying its `step` (an ISO 8601 duration) as
`cube:dimensions[].step`. STAC datacube permits several temporal dimensions, so a cube split by
`period` and `season` emits one temporal dimension each, while the top-level `temporal` drives the
Collection `extent.temporal`.

For grid data, `spatial.resolution[]` derives `cube:dimensions[].step` with native units.

- Use Raster Extension on raster assets when band-level physical metadata exists.

- Tabular data uses Table Extension `table:columns`; `spatial.geometry_column` maps to
  `table:primary_geometry`.

`classes[]` -> Classification Extension `classification:classes` on the relevant asset or variable.
Large class lists SHOULD be a sidecar asset with `roles=[metadata, describedby]` and a link with
`rel=describedby` from the variable's containing object.

### 4.5 Collection vs Item vs Summaries vs Asset

Decision rules:

- **Collection-level field** when the value is an authoritative statement about the whole resource
  (e.g., `title`, `license`, `extent`, `sci:citation`).
- **`summaries`** when the value describes the set of values available across Items / Assets /
  variables (e.g., available scenarios, available commodities, per-Item resolutions). Required
  Collection metadata MUST NOT live only in `summaries`.
- **Item-level field** when the value varies per Item and Item-level discovery is needed
  (`datetime`, `bbox`, `geometry`, per-Item variables). Items are produced from a `data[]` entry
  carrying an `href_template` (see 5.2); broader per-Item authoring beyond template expansion is not
  yet supported.
- **Asset-level field** when the value describes a specific file or access endpoint (`file:size`,
  asset `roles`, `type`).

### 4.6 CDH-specific fields

The `cdh.*`, `climate.*`, and `commodities` fields in the input record are encoded under the
`cgiar-cdh:` namespace. `commodities` is expanded into `themes` entries by the encoder via the CDH
commodity JSON lookup.

Faceted fields such as `scenarios` and `models` live in Collection `summaries` when they apply
across Items. `mip_era`, `baseline`, `bias_adjustment`, `downscaling`, and `not_recommended_for` are
Collection-level `cgiar-cdh:*` fields.

When a faceted value is also a data axis, emit it in both places: discovery fields and
`cube:dimensions`.

## 5. Assets

The STAC asset key is the entry's `name`; names must be unique across `data[]` and
`additional_assets[]`.

Every asset SHOULD include:

- `href`
- `title`
- `type` (media type)
- `roles`
- `description` if the asset is not self-explanatory

Recommended file metadata: File Extension `file:size` in bytes.

### 5.1 Asset `locations[]`

Each input `data[]` / `additional_assets[]` entry carries `locations[]` (one or more access paths to
the **same content**). Encode as:

- `assets[*].href` ← `locations[0].url` (the canonical location).
- Each additional `locations[]` entry -> an Alternate Assets Extension `alternate` entry on the same
  asset, keyed by a short name (from `locations[].title` when present, otherwise a generated key),
  carrying its `href` and optional `title`.
- The asset's `type` (media type) and `file:size` apply to all locations, since they are the same
  content.

### 5.2 Templated assets (`href_template`)

A `data[]` entry with `href_template` emits one STAC Item per token combination:

- Each `{token}` resolves against the `dimensions[]` entry of the same `name`; the encoder iterates
  the cross-product of those dimensions' `values`.
- For each combination, `locations[0]` + filled template is the canonical asset `href`. Additional
  locations become Alternate Assets entries.
- The Item inherits the Collection's `dimensions` / `variables`; the token values pin its position
  on those axes and SHOULD be emitted as Item properties so each slice is independently searchable.
- A `data[]` entry **without** `href_template` serializes as a single asset, per 5.1.

### 5.3 Asset roles

| Role          | Use                                                     |
| ------------- | ------------------------------------------------------- |
| `data`        | Primary data file, store, or service                    |
| `metadata`    | Metadata file, code list, schema, sidecar dictionary    |
| `validation`  | QA/QC or validation output                              |
| `describedby` | Documentation or code list that describes another asset |
| `thumbnail`   | Preview image                                           |
| `overview`    | Lower-resolution version of the data                    |
| `visual`      | RGB or visualization product                            |

Multiple roles on one asset are allowed (e.g., `[metadata, describedby]`).

## 6. Link relations

| rel                                                 | Use                                            |
| --------------------------------------------------- | ---------------------------------------------- |
| `self` / `root` / `parent` / `child` / `collection` | Catalog navigation                             |
| `cite-as`                                           | Preferred citation target (DOI when available) |
| `derived_from`                                      | Source dataset                                 |
| `predecessor-version` / `successor-version`         | Version chain (successor side derived)         |
| `latest-version`                                    | Current version (derived, on superseded)       |
| `version-history`                                   | Changelog or version history document          |
| `describedby` / `describes`                         | Documentation, schema, sidecar metadata        |
| `about`                                             | Project page or explanatory site               |
| `via`                                               | Intermediate source                            |
| `canonical`                                         | Authoritative URL when this is a mirror        |
| `alternate`                                         | Alternate representation of the same record    |
| `processing-expression`                             | Code or workflow that produced the data        |
| `service`                                           | Service endpoint                               |
| `license`                                           | License document                               |
| `preview` / `icon` / `thumbnail`                    | Imagery                                        |

Links SHOULD include `type` and `title` where useful. Extra fields on links MAY be used for
CDH-defined attributes such as `cgiar-cdh:code_version`.

## 7. Processing and provenance

`processing[]` is an id-keyed list of processing steps. When present, one step MUST use
`id: source`.

Encoding rules:

1. The `source` step maps to **Collection-level Provider** Processing Extension fields:
   - `description` -> `processing:lineage`
   - `date` -> `processing:datetime`
   - `{ <code.url basename>: code.version }` -> `processing:software`
2. Any `code.url` maps to `links[rel=processing-expression]` on the Collection.
3. The `source` step's `derived_from[].url` entries map to `links[rel=derived_from]` on the
   Collection.
4. Subsequent steps map to **Asset-level** Processing Extension fields on the assets that reference
   them in `processing_steps[]`.
5. `derived_from[]` entries are external URLs/STAC Metadata links and map to
   `links[rel=derived_from]`.

## 8. Validation expectations

For STAC validation to pass:

- Every declared extension URI in `stac_extensions` MUST be valid and pinned.
- Every `cgiar-cdh:*` field MUST be defined in the CDH STAC Extension schema. Adding undefined
  `cgiar-cdh:*` fields will fail validation.
- File sizes and projection codes SHOULD be present on assets that need them.
