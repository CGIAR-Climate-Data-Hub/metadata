# CGIAR CDH Extension Specification

- **Title:** CGIAR CDH
- **Identifier:**
  <https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.2.0/encodings/stac/schema.json>
- **Field Name Prefix:** cgiar-cdh
- **Scope:** Collection, Item, Links
- **Extension
  [Maturity Classification](https://github.com/radiantearth/stac-spec/tree/master/extensions/README.md#extension-maturity):**
  Proposal
- **Owner:** CGIAR Climate Data Hub

This document explains the CGIAR CDH Extension to the
[SpatioTemporal Asset Catalog](https://github.com/radiantearth/stac-spec) (STAC) specification.

The extension defines only what a CDH record carries into STAC that no native field or community
extension covers - access conditions, subject domain, reporting-unit resolution, climate provenance,
and the join and code-version attributes that ride on links. Everything with a native home stays
there: `title`, `description`, `license`, and `extent` are core STAC, citations use the Scientific
extension, dimensions and variables use Datacube, and projection codes use Projection. The
field-by-field placement is in [`mapping-stac.md`](../../mapping-stac.md); the authored fields these
come from are defined in [`standard.md`](../../standard.md).

The extension is versioned with the standard as a whole: one git tag covers the input schema, the
extensions, and this schema, so a record, the schema that validated it, and the extension that
describes its output all name the same release.

- Examples:
  - [Collection example](examples/collection.json): the usual case, a dataset with climate
    provenance and a resolution that STAC cannot express natively
  - [Item example](examples/item.json): one expanded slice of a templated data entry
  - [Invalid example](examples/invalid-unknown-field.json): an undefined `cgiar-cdh:` field, which
    the closed namespace rejects
- [JSON Schema](schema.json)
- [Changelog](../../../CHANGELOG.md)

## Fields

The fields in the table below can be used in these parts of STAC documents:

- [ ] Catalogs
- [x] Collections
- [x] Item Properties (incl. Summaries in Collections)
- [x] Assets (`cgiar-cdh:partition` only)
- [x] Links (incl. Link Templates)
- [ ] Bands

Catalogs are excluded on purpose: a CDH catalog node is a grouping directory that carries no
description of its own ([`standard.md`](../../standard.md) section 4.8). An asset carries exactly
one field, `cgiar-cdh:partition`, because it describes a single file; per-asset provenance uses the
Processing extension. The schema closes the namespace everywhere, so a stray or misplaced
`cgiar-cdh:` field fails validation instead of passing silently.

| Field Name                    | Type                                                 | Description                                                                                                                                         |
| ----------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| cgiar-cdh:resource_type       | string                                               | One of `dataset`, `software`, `service`, `document`. STAC implies this through object type and media types; carried for cross-encoding consistency. |
| cgiar-cdh:domain              | \[string]                                            | CDH subject domains, most significant first. Also expanded into Themes extension entries under the CDH domain scheme.                               |
| cgiar-cdh:access              | string                                               | `public`, `restricted`, or `non-public`. Absent means public. Distinct from `license`: what you may do versus whether you can get it.               |
| cgiar-cdh:access_note         | string                                               | What a user must do to obtain the data, or why it is catalogued but unavailable.                                                                    |
| cgiar-cdh:previous_version    | string                                               | Identifier of the record this one supersedes. Repeated from the `predecessor-version` link so a search can filter on it directly.                   |
| cgiar-cdh:partition           | [Partition Object](#partition-object)                | Item properties only: the values each axis spans within this Item. See the object for the asset form.                                               |
| cgiar-cdh:note                | string                                               | Caveats or interpretation-critical context that is not part of `description`.                                                                       |
| cgiar-cdh:funding             | \[[Name-URL Object](#name-url-object)]               | Funding sources for the resource.                                                                                                                   |
| cgiar-cdh:series              | [Name-URL Object](#name-url-object)                  | Program, initiative, or product brand the resource was published under. A discovery facet, not a hierarchy.                                         |
| cgiar-cdh:geography           | \[string]                                            | Place facet from the CDH geography vocabulary. Complements the spatial extent rather than replacing it.                                             |
| cgiar-cdh:spatial_resolution  | \[[Resolution Object](#resolution-object)]           | Format-independent spatial resolution, including point and polygon reporting units.                                                                 |
| cgiar-cdh:not_recommended_for | \[[Not-Recommended Object](#not-recommended-object)] | Uses to avoid, each with a reason and an optional alternative.                                                                                      |
| cgiar-cdh:mip_era             | string                                               | `CMIP5` or `CMIP6`.                                                                                                                                 |
| cgiar-cdh:scenarios           | \[string]                                            | Scenario labels (SSP/RCP, `historic`). Belongs in Collection `summaries` when it applies across Items.                                              |
| cgiar-cdh:models              | \[string]                                            | Climate model source IDs; `ensemble` for a multi-model ensemble. Usually a summary.                                                                 |
| cgiar-cdh:baseline            | [Period Object](#period-object)                      | Reference period the projections are expressed against.                                                                                             |
| cgiar-cdh:bias_adjustment     | [Method Object](#method-object)                      | Bias adjustment applied to the projections.                                                                                                         |
| cgiar-cdh:downscaling         | [Method Object](#method-object)                      | Downscaling applied to the projections.                                                                                                             |

### Link fields

These appear on a link object, never in Collection or Item properties.

| Field Name             | Type      | Description                                                                      |
| ---------------------- | --------- | -------------------------------------------------------------------------------- |
| cgiar-cdh:code_version | string    | Version of the code or workflow a `processing-expression` link points at.        |
| cgiar-cdh:left_fields  | \[string] | Key columns in this resource, paired positionally with `cgiar-cdh:right_fields`. |
| cgiar-cdh:right_fields | \[string] | Matching columns in the joined resource. Same length as `cgiar-cdh:left_fields`. |

### Additional Field Information

#### cgiar-cdh:spatial_resolution

Grid entries also become `cube:dimensions[].step` in the Datacube extension. They are repeated here
because point and polygon reporting units - "Kenya counties", admin level 2 - have no native STAC
home at all, and a consumer filtering on resolution needs one field to read rather than two shapes
to reconcile.

#### cgiar-cdh:partition

The shape is contextual, and deliberately so. On an **asset** each axis takes one scalar - this is
the file's exact position:

```json
{ "cgiar-cdh:partition": { "crop": "maize", "technology": "irrigated" } }
```

In **Item properties** each axis takes a list - the values that Item spans:

```json
{ "cgiar-cdh:partition": { "crop": ["maize", "rice"], "technology": ["irrigated"] } }
```

The axis names are `dimensions[].name` values from the record, or the reserved `variable` axis,
which are the same tokens the record's `href_template` expands over. A Collection has no partition:
it spans everything its Items and assets divide up. The schema enforces all three rules - scalars on
assets, lists in Item properties, and neither on a Collection.

#### cgiar-cdh:domain and cgiar-cdh:geography

Both take values from CDH vocabularies (`vocab/domain.json`, `vocab/geography.json`). The schema
validates them as non-empty strings rather than repeating the concept lists, so the vocabularies
stay the single source and cannot drift from a copy embedded here. The input schema enforces the
closed lists at authoring time.

### Name-URL Object

| Field Name | Type   | Description                     |
| ---------- | ------ | ------------------------------- |
| name       | string | **REQUIRED**. The name.         |
| url        | string | Landing page, where one exists. |

### Resolution Object

| Field Name       | Type             | Description                                                                                |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| type             | string           | **REQUIRED**. `xy` (regular grid), `x`, `y`, `point`, or `polygon`.                        |
| value            | number \| string | Grid spacing, or the administrative level.                                                 |
| unit             | string           | Unit of measurement, preferably UDUNITS-2 or UCUM; `admin-level` and similar for non-grid. |
| label            | string           | Human-readable resolution, e.g. `5 arc-minutes`, `Kenya counties`.                         |
| reference_system | string           | For `point` and `polygon`, the system defining the reporting units, e.g. `GAUL 2015`.      |
| note             | string           | Short spatial interpretation note.                                                         |

Exactly one characterization is carried: a single entry, or an `x` + `y` pair where grid spacing
differs.

### Partition Object

An object keyed by axis name. Values are scalars on an asset and arrays of scalars in Item
properties; at least one axis must be present.

### Not-Recommended Object

| Field Name  | Type   | Description                                |
| ----------- | ------ | ------------------------------------------ |
| use         | string | **REQUIRED**. The use being discouraged.   |
| reason      | string | **REQUIRED**. Why this use is discouraged. |
| use_instead | string | Recommended alternative, if any.           |

### Period Object

| Field Name | Type   | Description                     |
| ---------- | ------ | ------------------------------- |
| start_date | string | ISO 8601 date at any precision. |
| end_date   | string | ISO 8601 date at any precision. |

### Method Object

| Field Name        | Type             | Description                                                |
| ----------------- | ---------------- | ---------------------------------------------------------- |
| method            | string           | The method applied.                                        |
| reference_dataset | string           | Reference dataset used (`cgiar-cdh:bias_adjustment` only). |
| resolution        | number \| string | Target resolution (`cgiar-cdh:downscaling` only).          |

## Relation types

This extension defines no new relation types. The relations a CDH record uses are listed in
[`standard.md`](../../standard.md) section 6, all of them IANA, STAC, or OGC registered.

## Contributing

Changes to this extension follow the standard's own process: the schema, its examples, and the
mapping documents move together in one release.

### Running tests

```bash
npm run check-stac-extension
```

Every example under `examples/` must validate against `schema.json`, and every example named
`invalid-*.json` must fail. The check also asserts that the schema's `$id` and the URL it requires
in `stac_extensions` both name the release in `package.json`.
