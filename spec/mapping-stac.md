# CDH to STAC Mapping

Status: v0.2.0

This document describes the mapping of a CDH record as STAC. All field definitions and requirements
live in `standard.md`, A record is valid or invalid against the schema, never against this mapping.
Where the two disagree, `standard.md` wins and this document is wrong.

## 1. When STAC maps well

STAC fits resources with spatial, temporal, asset-level, variable-level, or data-cube discovery
needs:

- Rasters, COGs, Zarr, NetCDF, GeoParquet
- Data cubes and gridded climate products
- Spatial vector assets, spatial/temporal tabular assets
- APIs for access to geospatial data

A record with a spatial footprint - `bbox`, `crs`, `resolution`, or `geometry_column` (see
`standard.md` section 5.3) - carries everything STAC needs and can encode into it directly.
`spatial.geography` alone is a place facet, not a footprint.

### 1.1 Records without a spatial footprint

Whether a deployment also encodes non-spatial records as STAC, to keep one format across the whole
catalog, is allowed, although we acknowledge it is not the intended use for Stac. The constraints
that decide it:

- A **Collection** requires `extent.spatial.bbox`. There is no null or absent form, so a non-spatial
  Collection has to state a footprint it does not have - commonly the whole world, which then
  answers every spatial query.
- An **Item** may set `geometry: null`, and `bbox` is then _prohibited_ - honest about having no
  footprint. But `datetime` is still required, null only when `start_datetime` and `end_datetime`
  are both set, so a record with no temporal extent either needs a stand-in date. An Item is also a
  member of a Collection rather than a resource in its own right, and Items are already produced by
  `href_template` expansion (section 5.2), so the same construct would carry two meanings.

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

| CDH                         | STAC placement                                                                                                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                        | `id`                                                                                                                                                                                                                                                                     |
| `title`                     | `title`                                                                                                                                                                                                                                                                  |
| `description`               | `description`                                                                                                                                                                                                                                                            |
| `created` / `updated`       | `created` / `updated`                                                                                                                                                                                                                                                    |
| `keywords`                  | `keywords`                                                                                                                                                                                                                                                               |
| `license`                   | `license` (SPDX preferred)                                                                                                                                                                                                                                               |
| `access`                    | `cgiar-cdh:access` (STAC has no native access-rights field). Omitted = `public`; `public` MAY be left unencoded.                                                                                                                                                         |
| `access_note`               | `cgiar-cdh:access_note`; also suitable for schema.org `conditionsOfAccess` on generated landing pages.                                                                                                                                                                   |
| `contact[]`                 | `providers[]` and contacts extension `contacts[]` for additional contact info. At least one contact must include `licensor` in `roles`, which maps to a `licensor` provider.                                                                                             |
| `citation`                  | `sci:citation`                                                                                                                                                                                                                                                           |
| `doi`                       | `sci:doi` and `links[rel=cite-as]`                                                                                                                                                                                                                                       |
| `related_publications[]`    | `sci:publications[]`                                                                                                                                                                                                                                                     |
| `note`                      | `cgiar-cdh:note`                                                                                                                                                                                                                                                         |
| `version`                   | `version` (Version Extension)                                                                                                                                                                                                                                            |
| `deprecated`                | `deprecated` (Version Extension)                                                                                                                                                                                                                                         |
| `previous_version`          | `cgiar-cdh:previous_version`, plus `links[rel=predecessor-version]`. The encoder derives the rest of the chain from the `previous_version` graph: superseded records get `links[rel=successor-version]` and `links[rel=latest-version]` (see `standard.md` section 4.7). |
| `funding[]`                 | `cgiar-cdh:funding`                                                                                                                                                                                                                                                      |
| `series`                    | `cgiar-cdh:series` (`{ name, url }`). `name` is the grouping key for series facets and listings.                                                                                                                                                                         |
| `cdh.domain[]`              | `cgiar-cdh:domain` on the Collection; also expanded into Themes Extension `themes[]` under the CDH domain scheme. First entry drives sub-catalog placement.                                                                                                              |
| `keywords[]` (linked items) | Each linked-keyword entry (`{ term, scheme, uri }`) is also emitted as a Themes Extension `themes[]` concept, grouped by `scheme`. Plain-string keywords are emitted only into STAC `keywords`.                                                                          |
| Themes Extension `themes[]` | Encoder output only - populated from `cdh.domain`, `commodities`, and any linked-keyword entries. Not an author-facing input field.                                                                                                                                      |

### 4.2 Resource type

STAC implies resource type through object type and asset media types. CDH also emits
`cgiar-cdh:resource_type` for cross-encoding consistency.

### 4.3 Spatial / Temporal

| CDH                                         | STAC placement                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spatial.bbox`                              | `extent.spatial.bbox` (Collection) - the encoder prepends the derived overall/union box as the first entry, then the authored boxes; `bbox` (Item)                                                                                                                                                                                |
| `spatial.geography[]`                       | `cgiar-cdh:geography` array                                                                                                                                                                                                                                                                                                       |
| `spatial.crs`                               | Projection Extension: `proj:code` (preferred) or `proj:epsg`                                                                                                                                                                                                                                                                      |
| `spatial.geometry_column`                   | Table Extension `table:primary_geometry`                                                                                                                                                                                                                                                                                          |
| `spatial.resolution[]`                      | Grid entries (`xy`, `x`, `y`) map to `cube:dimensions[].step` (+ `unit`/`reference_system`); all entries also emit as `cgiar-cdh:spatial_resolution`                                                                                                                                                                              |
| `temporal.date` / `start_date` / `end_date` | `date` -> `datetime`; `start_date`/`end_date` -> `start_datetime`/`end_datetime`; `end_date: null` -> open interval; also `extent.temporal.interval` (Collection). Reduced-precision values expand to full RFC 3339 (start to period start, end inclusive to period end); the raw value also feeds schema.org `temporalCoverage`. |

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

Dimension types map as follows. The horizontal axes are derived, never authored: `spatial.bbox`
gives each one's `extent` and `spatial.resolution[]` its `step`.

| CDH `dimensions[].type` | STAC `cube:dimensions` entry                                  |
| ----------------------- | ------------------------------------------------------------- |
| derived from `spatial`  | `{ type: spatial, axis: x }` and `{ type: spatial, axis: y }` |
| `z`                     | `{ type: spatial, axis: z }`, carrying `values`, `unit`       |
| `temporal`              | `{ type: temporal }`, carrying `values` and `step`            |
| `location`, any other   | Additional Dimension: `{ type: <the CDH value> }`             |

Every dimension object requires an `extent`, which CDH does not author. The encoder derives it: from
the dimension's own `values` (first and last) where they are listed, and otherwise from the
top-level `temporal` coverage for a temporal axis or `spatial.bbox` for a horizontal one. That is
what lets a high-cardinality axis - a `day` column with no enumerated values - serialize at all. A
record may carry several temporal dimensions, each getting its own extent this way.

`unit` maps to `cube:dimensions[].unit`, which the datacube extension defines on every dimension
flavour. `spatial` and `geometry` are not accepted as authored types: the first is derived and the
second is a shape CDH does not emit, and the extension forbids both as custom type values.

`data[].nodata` is the asset default and fans out to every variable in that asset; a
`variables[].nodata` replaces it for that variable alone. For an entry templated over `{variable}`
(section 5.2), each expanded Item takes the nodata of the variable it holds.

- Use Raster Extension on raster assets when band-level physical metadata exists.

- Tabular data uses Table Extension `table:columns`; `spatial.geometry_column` maps to
  `table:primary_geometry`. Each `joins[]` entry emits a link to its `target` so the join is
  followable, with the `left_fields`/`right_fields` pairing carried as `cgiar-cdh:` link fields.

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
across Items. `mip_era`, `baseline`, `bias_adjustment`, `downscaling`, `intended_uses`, and
`not_recommended_for` are Collection-level `cgiar-cdh:*` fields.

When a faceted value is also a data axis, emit it in both places: discovery fields and
`cube:dimensions`.

### 4.7 Catalog position

A record's position (`standard.md` section 4.8) serializes as navigation only:

- Most CDH records are collections (with the non-spatial exeption mentioned above)
- A child record becomes a `child` link on its parent Collection and carries `parent` back to it,
  plus `root`.
- A pure grouping directory - one holding no record of its own - becomes a **Catalog** rather than a
  Collection, taking its `id` and `title` from the directory name. A Catalog carries no extent,
  license, or citation, so nothing has to be invented for it.
- Version snapshots are not children. They serialize as `predecessor-version` / `successor-version`
  / `latest-version` links (section 6), never as `child`.

No field value moves between a parent and a child. Values are resolved into each record before
serialization, so every published Collection is complete on its own.

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
  on those axes and are emitted as `cgiar-cdh:partition` so each slice is independently searchable.
  The shape is contextual: an Item's partition lists the values it spans (`{"crop": ["maiz"]}`),
  while the asset inside it states the one value it holds (`{"crop": "maiz"}`).
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
| `example`     | Runnable usage example (notebook, script, SQL)          |

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
- Every `cgiar-cdh:*` field MUST be defined in the
  [CDH STAC extension schema](./encodings/stac/schema.json), which closes the namespace: an
  undefined `cgiar-cdh:*` field, or a defined one in the wrong place, fails validation.
- Every emitted record MUST declare the extension in `stac_extensions`, pinned to the release the
  record targets.
- File sizes and projection codes SHOULD be present on assets that need them.
