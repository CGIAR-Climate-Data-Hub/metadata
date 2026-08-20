# CDH to OGC API Records Mapping

Status: v0.3.0

This document is **informative**. It describes the reference encoding of a CDH record as an **OGC
API Records** record. All field definitions and requirements live in `standard.md`, which is the
normative document: a record is valid or invalid against the schema, never against this mapping.
Where the two disagree, `standard.md` wins and this document is wrong.

## 1. What OGC API Records encodes well

OGC API Records fits resources that are discoverable but carry no spatial footprint to hang a STAC
Collection on:

- Non-spatiotemporal tabular datasets
- Documents and reports
- Code repositories
- Models, notebooks, methods, protocols
- Dashboards, services, APIs for non spatial data
- Knowledge products

Which encoding a record receives is inferred from the record, never author-set. Today that means
records without a spatial footprint encode here and the rest encode as STAC; a deployment that
prefers one format for everything is discussed in `mapping-stac.md` section 1.1.

## 2. Record encoding

The CDH OGC Records profile uses **recordJSON**, not GeoJSON Features. A record has:

- top-level identification fields (`id`, `type`, `time`, `geometry`, `links`)
- a `properties` object for descriptive metadata
- a `links` array for access points, citation targets, and related resources

For non-spatial CDH records:

- Set `geometry` to `null`.
- Omit `time` unless the resource has temporal relevance.

## 3. Native-fields-first rule

Encode each field in the most standard place available:

1. recordJSON top-level field (`id`, `type`, `time`, `geometry`, `links`)
2. recordJSON `properties.*` core property (`title`, `description`, `keywords`, `themes`,
   `contacts`, `license`, `created`, `updated`, `version`, `resourceLanguages`)
3. An approved `properties["cgiar-cdh:*"]` field
4. A sidecar metadata link with `rel=describedby`
5. Free-text `description` or `properties["cgiar-cdh:note"]`

`cgiar-cdh:*` names, value types, and vocabularies match the STAC profile. OGC-native or GeoDCAT
terms are used where available, e.g. `access` -> `dct:accessRights`.

## 4. Field-by-field placement

### 4.1 Core

| CDH                         | recordJSON placement                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                        | `id`                                                                                                                                                                       |
| `type` (resource)           | `properties.type`                                                                                                                                                          |
| `title`                     | `properties.title`                                                                                                                                                         |
| `description`               | `properties.description`                                                                                                                                                   |
| `created` / `updated`       | `properties.created` / `properties.updated`                                                                                                                                |
| `keywords`                  | `properties.keywords`                                                                                                                                                      |
| `cdh.domain[]`              | `properties["cgiar-cdh:domain"]`; also expanded into `properties.themes` under the CDH domain scheme. First entry is the primary domain.                                   |
| `keywords[]` (linked items) | Plain-string keywords are emitted into `properties.keywords`. Linked-keyword entries (`{ term, scheme, uri }`) are also added to `properties.themes`, grouped by `scheme`. |
| `properties.themes`         | Encoder output only - populated from `cdh.domain`, `commodities`, and any linked-keyword entries. Not an author-facing input field.                                        |
| `license`                   | `properties.license`                                                                                                                                                       |
| `access`                    | `properties["dct:accessRights"]` using the EU accessRights NAL URI. Omitted = `public`; `public` MAY be left unencoded. Advertise GeoDCAT via `conformsTo`.                |
| `access_note`               | `properties["cgiar-cdh:access_note"]`; also suitable for schema.org `conditionsOfAccess` on generated landing pages.                                                       |
| `contact[]`                 | `properties.contacts[]`. At least one contact must include `licensor` in `roles`.                                                                                          |
| `citation`                  | `properties["cgiar-cdh:citation"]`                                                                                                                                         |
| `doi`                       | `links[rel=cite-as]`                                                                                                                                                       |
| `related_publications[]`    | `properties["cgiar-cdh:related_publications"]`                                                                                                                             |
| `note`                      | `properties["cgiar-cdh:note"]`                                                                                                                                             |
| `version`                   | `properties.version`                                                                                                                                                       |
| `deprecated`                | `properties["cgiar-cdh:deprecated"]`                                                                                                                                       |
| `previous_version`          | `links[rel=predecessor-version]`                                                                                                                                           |
| `funding[]`                 | `properties["cgiar-cdh:funding"]`                                                                                                                                          |
| `series`                    | `properties["dcat:inSeries"]` (`{ name, url }`, DCAT 3 dataset series). Advertise DCAT 3 via `conformsTo`.                                                                 |

### 4.2 Spatial / Temporal (when applicable)

OGC Records is the non-spatial CDH path. Records with geospatial extent, CRS, spatial resolution, or
embedded geometry-column metadata route to STAC. OGC Records may still carry named geography labels
and temporal metadata for discovery.

| CDH                                         | recordJSON placement                                                                                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spatial.geography[]`                       | `properties["dct:spatial"]` (GeoDCAT spatial coverage). The encoder resolves each `geography` id to its place IRI; advertise GeoDCAT via `conformsTo`. (STAC keeps `cgiar-cdh:geography`.)              |
| `temporal.date` / `start_date` / `end_date` | `time`: instant from `date`, interval `{ interval: [start, end] }` from `start_date`/`end_date`, or open interval when `end_date: null`. Reduced-precision values expand (end inclusive to period end). |

The CDH OGC Records profile does not emit `spatial.bbox`, `spatial.crs`, `spatial.geometry_column`,
or `spatial.resolution[]`; those records route to STAC.

### 4.3 Data fields

For OGC Records resources that need structured field metadata:

| CDH            | recordJSON placement                                                        |
| -------------- | --------------------------------------------------------------------------- |
| `dimensions[]` | `properties["cgiar-cdh:dimensions"]`                                        |
| `variables[]`  | `properties["cgiar-cdh:variables"]` and/or `links[rel=describedby]` sidecar |
| `classes[]`    | `links[rel=describedby]` to a sidecar class list                            |

Use STAC for tabular datasets with embedded geometry or spatial asset metadata.

### 4.4 CDH-specific fields

`cdh.*` and `climate.*` fields encode under `properties["cgiar-cdh:*"]`. `commodities` expands into
`properties.themes`. OGC Records has no STAC `summaries`, so faceted values are direct array
properties.

### 4.5 Catalog position

A record's position (`standard.md` section 4.8) creates no new resource here. Records stay
individual records in the same record collection, and the hierarchy is carried as `parent` and
`child` links between them. Unlike the STAC encoding (`mapping-stac.md` section 4.7), no
intermediate catalog resource is generated for a pure grouping directory, because a record
collection is already the unit an OGC API - Records deployment serves.

## 5. Links

OGC API Records uses `links` for access, citation targets, services, related resources,
documentation, and provenance.

### 5.1 Link relations

| rel                                         | Use                                          |
| ------------------------------------------- | -------------------------------------------- |
| `self`                                      | This record                                  |
| `collection`                                | Parent record collection                     |
| `parent` / `child`                          | Family position (section 4.5)                |
| `cite-as`                                   | DOI or preferred citation target             |
| `describes` / `describedby`                 | Described resource / documentation or schema |
| `enclosure`                                 | Downloadable file                            |
| `service`                                   | Service endpoint                             |
| `derived_from`                              | Source dataset                               |
| `predecessor-version` / `successor-version` | Version chain                                |
| `about`                                     | Project page or explanatory site             |
| `via`                                       | Intermediate source                          |
| `canonical`                                 | Authoritative URL                            |
| `alternate`                                 | Alternate representation                     |
| `license`                                   | License document                             |
| `processing-expression`                     | Code or workflow that produced the resource  |
| `preview` / `icon`                          | Imagery                                      |

### 5.2 File metadata on links

For OGC Records, file-level metadata lives on the link, not as top-level record metadata:

| CDH                        | recordJSON placement                                    |
| -------------------------- | ------------------------------------------------------- |
| `data[].locations[].url`   | `links[*].href`                                         |
| `data[].locations[].title` | `links[*].title` (access label)                         |
| `data[].name`              | `links[*].title`                                        |
| `data[].media_type`        | `links[*].type`                                         |
| `data[].file_size`         | `links[*].length`                                       |
| `data[].description`       | `links[*].title` / `description` extension if supported |

Each `locations[]` entry becomes a link. `locations[0]` gets the primary relation (`enclosure` /
`service`); additional same-content locations use `rel=alternate`.

### 5.3 Primary data link

The required CDH `data[]` entries map to `links[rel=enclosure]` for downloadable files, or
`links[rel=service]` for service endpoints (using the canonical `locations[0]`). If the resource is
a landing page, code repository, dashboard, or model, use `rel=about`, `rel=code`
(`processing-expression` for workflow code), or the most appropriate relation from section 5.1.

## 6. Processing and provenance

OGC API Records has no native processing model. The CDH `processing[]` block maps to a structured
CDH property plus standard links.

Encoding rules:

1. The full `processing[]` array, in order, is emitted as `properties["cgiar-cdh:processing"]`. The
   schema mirrors the YAML.
2. The `source` step's `code.url` maps to `links[rel=processing-expression]` on the record. Include
   `cgiar-cdh:code_version` as a link extra field.
3. Each step's `derived_from[].url` entries (always external URLs) map to `links[rel=derived_from]`
   on the record.
4. Per-asset processing chains live in the corresponding link's `cgiar-cdh:processing_steps` extra
   field (mirroring `data[].processing_steps[]` in the YAML).

## 7. Validation expectations

- Records MUST validate against the OGC API Records Part 1 recordJSON schema.
- `cgiar-cdh:*` properties under `properties` MUST conform to the CDH OGC Records profile schema.
- Records describing non-spatial resources MUST set `geometry: null` and MUST NOT include a
  fabricated `bbox`.
