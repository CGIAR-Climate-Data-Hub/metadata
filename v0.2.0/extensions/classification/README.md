# Classification Extension

Class definitions for categorical, classified, or bitfield variables.

- **Applies to:** classified, categorical, or bitfield variables (e.g., land cover, suitability
  classes).
- **Declared in:** `extensions[]`.

## `classes[]`

- **Requirement:** Conditional. Required for classified, categorical, or bitfield variables.
- **Expected value:** List of `{ variable, values: [ { value, label, description } ] }`.
- **Rules:**
  - Each entry must reference a declared variable name.
  - For long class lists, use a `rel=describedby` sidecar.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.2.0/extensions/classification/schema.json
classes:
  - variable: land_cover
    values:
      - value: 1
        label: Cropland
        description: Cultivated and managed land.
      - value: 2
        label: Forest
        description: Tree-dominated cover.
```
