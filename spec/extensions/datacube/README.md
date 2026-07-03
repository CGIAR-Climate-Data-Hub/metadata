# Datacube Extension

Dimensions and variables for gridded, multidimensional, or tabular data.

- **Applies to:** datasets with measurement variables, bands, or columns, and any dataset whose
  meaning depends on axes/codes.
- **Declared in** a record's `extensions[]`. See [the standard](../../standard.md), §4.3, for the
  extension mechanism.

## `dimensions[]`

- **Requirement:** Conditional. Required for data cubes, tabular data with axes, or any dataset
  whose meaning depends on axes/codes.
- **Expected value per dimension:** `{ name, type, description, values, reference_system }`.
- **Rules:**
  - `type` should be one of `spatial`, `temporal`, `bands`, or a domain-specific axis name (e.g.,
    `crop`, `technology`, `scenario`).
  - `values` lists the allowed values along the dimension.
  - `reference_system` is a URI or label for a controlled vocabulary when one applies (e.g., the
    AGROVOC URI for a `crop` dimension).
  - **Coded values MUST be defined.** If `values` contains short codes whose meaning is not obvious
    (e.g., `["I", "A", "R"]` for irrigated / all / rainfed, or MAPSPAM crop codes like
    `["whea", "maiz", "rice"]`), the record MUST resolve them through one of:
    1. `reference_system` pointing at a published controlled vocabulary that defines the codes, OR
    2. an inline definition in the dimension's `description` (e.g.,
       `"I = Irrigated, A = All tech, R = Rainfed"`). Limit this to very short, fixed code sets
       where the full definition fits cleanly in one sentence, OR
    3. a sidecar asset (e.g., a JSON or CSV code list) linked from the record with `rel=describedby`
       and `roles: [metadata, describedby]`. One sidecar file MAY cover the codes for **all**
       dimensions in the dataset - a separate sidecar per dimension is not required. The dimension's
       `description` should reference the sidecar.
  - Do not invent inline structured fields (e.g., `value_definitions`) on `dimensions[]` - that
    would break Datacube Extension validation. Use one of the three options above.
  - A coded dimension without any of these will fail review - the codes become unusable for
    downstream tools.

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
  - `description` carries the stable definition and normal reading guidance for the variable. Say
    what the variable measures, then add the reading rule when it matters (for example, "Higher
    values indicate greater heat hazard" or "Negative values indicate lower than the baseline").
  - `note` carries caveats, limitations, warnings, or non-obvious use rules for the variable (e.g.,
    "Data must be aggregated to with weighted_mean from ... variable"). Dataset-wide limitations
    belong in the record-level `note` field instead.
  - For inspectable formats, the CDH review process may add technical variable metadata such as
    names, data types, bands, nodata values, or dimensions when it can be determined from the asset
    URL, file extension, or inspectable metadata. Authors are still responsible for descriptions,
    units, reading guidance, and caveats; these cannot be reliably determined from the file alone.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.1.0/extensions/datacube/schema.json
dimensions:
  - name: crop
    type: crop
    description: MAPSPAM crop code. Full labels are in the dimension codes sidecar.
    values: [whea, maiz, rice]
    reference_system: https://www.mapspam.info/
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
