# Datacube Extension

Dimensions and variables for gridded, multidimensional, or tabular data.

- **Applies to:** datasets with measurement variables, bands, or columns, and any dataset whose
  meaning depends on axes/codes.
- **Declared in:** `extensions[]`.

## `dimensions[]`

- **Requirement:** Conditional. Required for data cubes, tabular data with axes, or any dataset
  whose meaning depends on axes/codes.
- **Expected value per dimension:**
  `{ name, type, description, values, reference_system, step, unit }`.
- **Rules:**
  - `type` is either a **reserved** value or a domain axis name:
    - `temporal` - an axis of ISO 8601 dates or instants. The only type that may carry a `step`, and
      the only spelling that works: `time`, `date`, `datetime`, and `timestamp` are rejected rather
      than silently read as domain axes. A record may declare several.
    - `z` - a vertical axis: soil depth, height, or pressure level. **At most one per record**,
      since it is the only spatial axis a record ever declares. List its levels in `values` and give
      it a `unit`.
    - `location` - a column identifying a place rather than measuring something, such as an admin or
      station code. It is a key, not an axis of space.
    - Anything else names a domain axis after what it varies (`crop`, `technology`, `scenario`).
      Lowercase, digits, `-` and `_`.
  - **Bands are not a dimension.** The datacube extension has no band dimension type; a multi-band
    file's bands are `variables[]`, which serialize as `cube:variables` and, for COG-style rasters,
    `raster:bands`. `bands` is still an accepted axis name if a resource genuinely varies along
    something it calls a band, but it gets no special treatment.
  - **`spatial` and `geometry` are rejected.** The horizontal lat/lon grid is derived from the
    top-level `spatial` field and is never declared here, and the STAC datacube extension forbids
    both words as custom dimension types. Use `z` for a vertical axis and `location` for a place
    key.
  - `unit` is the unit of measurement for the values, preferably UDUNITS-2 or UCUM. Give one on a
    `z` dimension (`cm`, `m`, `hPa`) and on any numeric domain axis whose values are not
    self-describing. It is not a substitute for `reference_system`, which names the vocabulary or
    vertical CRS the values are coded against - a `z` dimension can carry both.
  - **Do not declare the horizontal lat/lon grid here.** It comes from the top-level `spatial`
    field, and encoders derive the `x`/`y` cube dimensions from it. `variables[].dimensions` may
    still reference `lat`/`lon` even though they are not listed here.
  - **Declare every temporal axis here** as `type: temporal` with a `step`. The top-level `temporal`
    field carries only the coverage extent (start/end); all temporal cadence lives on these
    dimensions. A record may declare **several** - files split by year with a day column inside each
    is two temporal axes, and so is one store holding a yearly climatology beside a daily field.
  - **A temporal dimension's `values` are ISO 8601 dates or instants, written as strings.** Bare
    numbers (`2030`) and range labels (`2020-2040`) are rejected. A **binned** axis lists each bin's
    start and states its length in `step`, exactly as a monthly axis lists month starts: a 30-year
    projection axis is `values: ["2021", "2051"]` with `step: P30Y`. The readable form (`2021-2050`)
    is derived from the value and the step, not authored.
  - **A cyclic label axis is not temporal.** `DJF`/`MAM`/`JJA`/`SON` repeats every year, while a
    temporal axis runs in one direction, so a season is a domain axis named `season`. Its `P3M` was
    never a step along an axis - it is how long each label covers - so state that in `description`
    alongside the code list in `reference_system`.
  - `step` is the spacing of one step, always an ISO 8601 duration (`P3M`, `P20Y`), and valid **only
    on a `type: temporal` dimension**. It is the only cadence field a dimension carries; a domain
    axis describes its cadence in prose, because STAC has no slot for it.
  - `values` lists the allowed values along the dimension. Omit it for a high-cardinality key column
    (you would not enumerate every household id or admin code).
  - `reference_system` is the vocabulary the values are coded against; prefer a resolvable URI when
    one exists (e.g. the AGROVOC URI for a `crop` dimension).
  - Define coded values. Use `reference_system`, a short inline explanation in `description`, or a
    sidecar code list linked with `rel=describedby`.
  - `name` MUST be unique across `dimensions[]` and `variables[]` together: they share one
    namespace, and a duplicate would overwrite its twin when serialized.
  - Do not add custom fields such as `value_definitions` to `dimensions[]`.

## `variables[]`

- **Requirement:** Conditional. Required when the resource has measurement variables, bands, or
  columns.
- **Expected value per variable:**
  `{ name, dimensions, description, data_type, unit, nodata, note }`.
- **Rules:**
  - `unit` is the unit of measurement, preferably compliant with UDUNITS-2 or UCUM (e.g., `ha`, `t`,
    `t ha-1`, `K`, `kg m-2 s-1`, `{head}/km2`) rather than strictly validated. Use `1` or omit for
    dimensionless quantities.
  - Climate variables should use CF standard names where practical (e.g., `precipitation_flux`,
    `air_temperature`).
  - `data_type` follows numpy-style names (`float32`, `int16`, …).
  - `nodata` is the fill value for this variable, and is only needed where it differs from the
    asset's `data[].nodata` - which stays the default for every variable that does not state one.
    Use it when one store holds variables of different types (a `float32` measure filled with
    `-9999` beside a `uint8` classification filled with `255`); a single GeoTIFF cannot, since its
    bands share one data type and one fill value.
  - `description` says what the variable measures. Add reading guidance when direction matters.
  - `note` is for variable-specific caveats. Use record-level `note` for dataset-wide limitations.
  - Review may add technical metadata from inspectable files, but not meaning, units, or caveats.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.3.0/extensions/datacube/schema.json
dimensions:
  - name: crop
    type: crop
    description: Crop code. Full labels are in the dimension codes sidecar.
    values: [whea, maiz, rice]
    reference_system: https://example.org/crop-codes
variables:
  - name: yield
    dimensions: [lat, lon, crop, technology]
    description: Crop yield for each grid cell. Higher values indicate more output.
    data_type: float32
    unit: t ha-1
    note: >
      Relative quantity; do not sum across cells. Use a weighted mean with harvested_area as the
      weight.
```

### Two temporal axes, and a season that is not one

A cube split by 20-year projection `period` and by `season` has **one** temporal axis, not two. The
period axis is temporal: its values are the ISO 8601 start of each window, and `step` says how long
each one runs. The season axis is cyclic - `DJF` recurs every year - so it is a domain axis, and the
three months each label covers are stated in prose because STAC has nowhere to put them.

```yaml
temporal:
  start_date: "2020-01-01"
  end_date: "2080-12-31"
dimensions:
  - name: period
    type: temporal
    description: 20-year projection window, labelled by its first year.
    values: ["2021", "2041", "2061"] # window starts; 2021-2040, 2041-2060, ...
    step: P20Y
  - name: season
    type: season
    description:
      Meteorological season. Each value covers three months - DJF is December to February.
    reference_system: https://example.org/vocab/seasons
    values: [DJF, MAM, JJA, SON]
variables:
  - name: tas
    dimensions: [lat, lon, period, season]
    description: Near-surface air temperature.
    data_type: float32
    unit: K
```

Two axes really are temporal when both carry dates. Files split by year, each holding a day column:

```yaml
dimensions:
  - name: year
    type: temporal
    description: Year each file covers; the href_template token.
    values: ["2020", "2021", "2022"]
    step: P1Y
  - name: day
    type: temporal
    description: Day of observation within each file. High cardinality, so values are not listed.
    step: P1D
```

## `joins[]`

Joins from this table to other catalogued datasets - typically a value table keyed to an external
geometry/boundary set rather than embedding geometry.

- **Requirement:** Optional.
- **Expected value per join:** `{ target, left_fields, right_fields }`.
- **Rules:**
  - `target` is the resolvable URI or id of the dataset joined to (its own record).
  - `left_fields` are this record's key columns; each MUST be a declared
    `dimensions[]`/`variables[]` name. `right_fields` are the matching columns in the target.
  - The two arrays pair **positionally** and MUST be the same length, so composite keys (e.g.
    `[adm0_code, adm2_code]`) and differing column names on each side are both handled.
  - No join type or cardinality is expressed; an entry is an equi-join on the paired fields.

Model the join as two records: the boundary/index set is its own record (its geometries plus the
code columns), and the value table declares its key columns and the `joins[]` entry:

```yaml
dimensions:
  - name: adm0_code
    type: location
    description: GAUL 2015 country code.
  - name: adm2_code
    type: location
    description: GAUL 2015 admin-2 code.
variables:
  - name: population
    description: Population per admin unit.
    unit: "1"
joins:
  - target: https://cdh.example/boundaries/gaul-2015-admin2
    left_fields: [adm0_code, adm2_code]
    right_fields: [ADM0_CODE, ADM2_CODE]
```
