# Classification Extension

Class definitions for categorical, classified, or bitfield variables.

- **Applies to:** classified, categorical, or bitfield variables (e.g., land cover, suitability
  classes).
- **Declared in** a record's `extensions[]`. See [the standard](../../standard.md), §4.3, for the
  extension mechanism.

## `classes[]`

- **Requirement:** Conditional. Required for classified, categorical, or bitfield variables.
- **Expected value:** List of `{ variable, values: [ { value, label, description } ] }`.
- **Rules:**
  - Each entry must reference a declared variable name.
  - For long class lists, prefer a sidecar asset linked with `rel=describedby` and keep only summary
    information here.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.1.0/extensions/classification/schema.json
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
