# Agriculture Extension

Agricultural commodities described by the record.

- **Applies to:** agriculture, food-systems, livestock, and crop resources.
- **Declared in** a record's `extensions[]`. See [the standard](../../standard.md), §4.3, for the
  extension mechanism.

## `commodities[]`

- **Requirement:** Conditional. Required for agriculture, food-systems, livestock, and crop
  datasets.
- **Vocabulary:** Values MUST appear in `vocab/commodity.json`. The encoder uses that file to
  resolve each name to its AGROVOC URI.
- **Expected value:** List of friendly names (e.g., `banana`, `cassava`, `arabica-coffee`).
- **Encoding:** Expanded into a `themes` entry under the CDH commodity scheme (see the
  [crosswalk](../../crosswalk.md)). Does not appear as a standalone field in the encoded output.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.1.0/extensions/agriculture/schema.json
commodities:
  - maize
  - rice
  - wheat
```
