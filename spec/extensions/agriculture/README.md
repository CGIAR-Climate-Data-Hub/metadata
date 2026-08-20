# Agriculture Extension

Agricultural commodities described by the record.

- **Applies to:** agriculture, food-systems, livestock, and crop resources.
- **Declared in:** `extensions[]`.

## `commodities[]`

- **Requirement:** Conditional. Required for agriculture, food-systems, livestock, and crop
  datasets.
- **Vocabulary:** `vocab/commodity.json`; values resolve to AGROVOC URIs.
- **Expected value:** List of friendly names (e.g., `banana`, `cassava`, `arabica-coffee`).
- **Encoding:** Expanded into `themes` under the CDH commodity scheme.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.3.0/extensions/agriculture/schema.json
commodities:
  - maize
  - rice
  - wheat
```
