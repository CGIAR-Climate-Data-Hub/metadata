# CDH Extension

CGIAR Climate Data Hub governance: domain classification and use guidance.

- **Applies to:** all CDH records - the CDH profile requires this extension.
- **Declared in** a record's `extensions[]`. See [the standard](../../standard.md), §4.3, for the
  extension mechanism.

## `cdh.domain[]`

- **Requirement:** Required.
- **Definition:** The CDH-controlled domain(s) the record belongs to. This is the field that powers
  the website filter, group-by, and STAC sub-catalog placement.
- **Expected value:** List of one or more domain ids from `vocab/domain.json`. **Multi-valued and
  ordered**: the first entry is the **primary** domain (drives sub-catalog placement); subsequent
  entries are secondary and enable cross-cutting search.
- **Vocabulary:** Closed set defined in `vocab/domain.json`. Adding a new domain requires updating
  that file.
- **Encoding:**
  - Encoded as `cgiar-cdh:domain` (STAC) / `properties["cgiar-cdh:domain"]` (OGC Records).
  - Also expanded by the encoder into a `themes` entry under the
    `https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/vocab/domain.json` scheme for
    linked-data consumers (see the [crosswalk](../../crosswalk.md)).

## `cdh.use_cases[]`

- **Requirement:** Optional
- **Vocabulary:** Free-form text for now. May migrate to a controlled vocabulary as needed.

## `cdh.not_recommended_for[]`

- **Requirement:** Optional
- **Expected value:** List of `{ use, reason, use_instead }`.

## Example

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/v0.1.0/extensions/cdh/schema.json
cdh:
  domain: [agricultural-production] # primary first; rest are secondary
  use_cases:
    - proposal preparation
    - adaptation planning
  not_recommended_for:
    - use: field-scale farm management
      reason: The grid is too coarse for field-scale operational decisions.
      use_instead: Local survey or administrative production data.
```
