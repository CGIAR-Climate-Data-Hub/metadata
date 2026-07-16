# Datacube Extension

Dimensions and variables for gridded, multidimensional, or tabular data.

- **Applies to:** datasets with measurement variables, bands, or columns, and any dataset whose
  meaning depends on axes/codes.
- **Declared in:** `extensions[]`.

## `dimensions[]`

- **Requirement:** Conditional. Required for data cubes, tabular data with axes, or any dataset
  whose meaning depends on axes/codes.
- **Expected value per dimension:** `{ name, type, description, values, reference_system, step }`.
- **Rules:**
  - `type` is a domain axis name (e.g., `crop`, `technology`, `scenario`), `bands`, or `temporal`.
  - **Do not declare the horizontal lat/lon grid here.** It comes from the top-level `spatial`
    field, and encoders derive the `x`/`y` cube dimensions from it. `variables[].dimensions` may
    still reference `lat`/`lon` even though they are not listed here.
  - **Declare every temporal axis here** as `type: temporal` with a `step`. The top-level `temporal`
    field carries only the coverage extent (start/end); all temporal cadence lives on these
    dimensions. A cube may have several temporal axes (e.g. `season` within 20-year `period`s),
    which STAC datacube permits.
  - `step` is the spacing of one step, always an ISO 8601 duration (`P3M`, `P20Y`), and valid **only
    on a `type: temporal` dimension**. It is the only cadence field a dimension carries.
  - `values` lists the allowed values along the dimension.
  - `reference_system` is a URI or label for a controlled vocabulary when one applies (e.g., the
    AGROVOC URI for a `crop` dimension).
  - Define coded values. Use `reference_system`, a short inline explanation in `description`, or a
    sidecar code list linked with `rel=describedby`.
  - Do not add custom fields such as `value_definitions` to `dimensions[]`.

## `variables[]`

- **Requirement:** Conditional. Required when the resource has measurement variables, bands, or
  columns.
- **Expected value per variable:** `{ name, dimensions, description, data_type, unit, note }`.
- **Rules:**
  - `unit` is the unit of measurement, preferably compliant with UDUNITS-2 or UCUM (e.g., `ha`, `t`,
    `t ha-1`, `K`, `kg m-2 s-1`, `{head}/km2`) rather than strictly validated. Use `1` or omit for
    dimensionless quantities.
  - Climate variables should use CF standard names where practical (e.g., `precipitation_flux`,
    `air_temperature`).
  - `data_type` follows numpy-style names (`float32`, `int16`, …).
  - `description` says what the variable measures. Add reading guidance when direction matters.
  - `note` is for variable-specific caveats. Use record-level `note` for dataset-wide limitations.
  - Review may add technical metadata from inspectable files, but not meaning, units, or caveats.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.1.0/extensions/datacube/schema.json
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

### Two temporal axes (seasons within projection periods)

A cube split by 20-year projection `period` and by `season` has two temporal axes. Declare both as
`type: temporal` dimensions with their own `step`; `temporal` carries only the overall extent.

```yaml
temporal:
  start_date: "2020-01-01"
  end_date: "2080-12-31"
dimensions:
  - name: period
    type: temporal
    description: 20-year projection window.
    values: ["2020-2040", "2041-2060", "2061-2080"]
    step: P20Y
  - name: season
    type: temporal
    description: Meteorological season.
    values: [DJF, MAM, JJA, SON]
    step: P3M
variables:
  - name: tas
    dimensions: [lat, lon, period, season]
    description: Near-surface air temperature.
    data_type: float32
    unit: K
```
