# CDH Extension

CGIAR Climate Data Hub governance: domain classification and use limitations.

- **Applies to:** all CDH records - the CDH profile requires this extension.
- **Declared in:** `extensions[]`.

## `cdh.domain[]`

- **Requirement:** Required.
- **Definition:** CDH domain(s) used for filtering, grouping, and STAC sub-catalog placement.
- **Expected value:** List of one or more domain ids from `vocab/domain.json`. **Multi-valued and
  ordered**: the first entry is the **primary** domain (drives sub-catalog placement); subsequent
  entries are secondary and enable cross-cutting search.
- **Vocabulary:** `vocab/domain.json`.
- **Encoding:**
  - Encoded as `cgiar-cdh:domain` (STAC) / `properties["cgiar-cdh:domain"]` (OGC Records).
  - Also expanded into `themes` under the CDH domain scheme.

## `cdh.not_recommended_for[]`

- **Requirement:** Optional
- **Expected value:** List of `{ use, reason, use_instead }`.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.2.0/extensions/cdh/schema.json
cdh:
  domain: [agricultural-production] # primary first; rest are secondary
  not_recommended_for:
    - use: field-scale farm management
      reason: The grid is too coarse for field-scale operational decisions.
      use_instead: Local survey or administrative production data.
```
