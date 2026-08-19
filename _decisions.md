# CDH Metadata — Nested / Multi-Representation Decisions (2026-06-18)

> Internal working notes. Not part of the published standard.

## Core decision rule

**Unit of independent discovery + does its metadata diverge?** That single
question routes everything below.

## Asset vs Item vs Collection

| Situation                                                                   | Model                                               |
| --------------------------------------------------------------------------- | --------------------------------------------------- |
| Same content, different format/access path                                  | Asset, or `locations[]` alternate — ONE collection  |
| One dataset sliced along declared dimensions, per-slice fetch/search needed | ONE collection, generate slices via `href_template` |
| Genuinely distinct dataset (own DOI / citation / license / governance)      | Separate collection                                 |

- **asset** = access path or sidecar of something already described.
- **item** = brings its own structural schema, or needs independent discovery.
- **collection** = its own dataset identity (extent, summaries, citation).

## Fork (new collection) vs Stay (one collection)

| Stay                                | Fork                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| add `variables[]` on same grid      | a dimension added/removed                                         |
| repackage format (Zarr↔COG↔Parquet) | a dimension's resolution/extent changes (daily→seasonal, 5′→0.5°) |
| add access mirrors (`locations[]`)  | lossy/irreversible transform (aggregate, resample, classify)      |

- **Rule:** fork when the cube changes *shape* or the transform *loses
  information*; stay when it's the same cube re-expressed/extended.
- Publication test (own DOI/license/release) can also force a fork even with an
  identical cube.
- **Derived product = sibling linked by `derived_from`, NOT a subdir child.**
  Derivation is a link, not containment.
- Different producer alone ≠ fork — handle with producers + provenance.
- Worked examples: daily→seasonal = **fork** (shape + lossy); +2 derived
  variables = **stay** (or sibling if separately published, cited, licensed).

## Avoiding collection sprawl

- Most "sprawl" is **mis-forking**: scenario / model / crop / region /
  time-window-within-a-resolution are dimension *values* or `summaries` inside
  ONE collection — never separate collections.
- Group genuine *structural* forks of one product under a **parent "family"
  collection** (the real trigger for nesting).
- Naming discipline: shared stem + distinguishing axis in a fixed slot
  (`chirps-daily`, `chirps-seasonal`).
- Don't pre-materialize the combinatorial grid (YAGNI on collections).
- **Never cut collection count by merging honest cubes** — that trades a
  solvable navigation problem for an unsolvable description-lie. Solve count at
  the discovery layer.

## Distribution: one `data[]` (REVISED 2026-06-19)

Supersedes the earlier three-bucket / separate-`items[]` plan. There is **no
separate `items[]`** — the author lists data once in `data[]`, and the entry
shape tells the encoder how to serialize:

- **`href_template` absent** → `locations[].url` are full file URLs → one
  **collection asset** (extra locations = mirrors/alternates). Unchanged behavior.
- **`href_template` present** → `locations[].url` are **base prefixes**, the
  template is appended (`base + filled-template`) → **STAC Items**, one per token
  combination. Each item href = `locations[0]` + filled (canonical), each
  additional location + filled → an **alternate**. So HTTPS-canonical +
  S3-alternate per slice fall out automatically.

Rules:

- `locations` stays **required** (always the access path); `href_template` is the
  one optional addition. They **compose** — no `oneOf`, no exclusivity.
- `href_template` tokens = `dimensions[].name`, plus the reserved `{variable}`
  token → `variables[].name` (2026-07-06: a variable is a measure, not an axis;
  per-variable files are a layout fact, so the token resolves from `variables[]`
  instead of forcing a fake dimension. `variable` is rejected as a dimension
  name). Substitution sets = `dimensions[].values` / variable names. Flat Items,
  not sub-collections (slices of one cube are facets). No `expand_over` — infer
  expansion from the `{tokens}`.
- **Values substituted verbatim** → `dimensions[].values` must equal the
  file-name tokens (case-sensitive); display labels go in `classes`, not
  `values`. Every token dimension must list values (continuous axes can't be
  tokens). **Dense assumption**: every combination must exist; sparse → future
  build-time existence check (don't alias mismatched names — fix at source).
- Author ends the base `url` with `/` (or puts the separator in the template) —
  the encoder just concatenates `base + filled-template`.
- Match tokens to real file layout: `..._{crop}_{technology}_{variable}.tif` =
  144 single-slice files; `..._{crop}_{technology}.tif` = 36 files, `variable`
  as bands inside each.
- `additional_assets[]` stays separate (sidecars: codes, QA/QC, thumbnail).
  Could fold into one roled assets array later — separate simplification, not now.
- Infer representation (cube/raster/table) from `media_type`; no explicit type field.

## Tables — OPEN (parked, revisit)

How a **single-file table** (parquet with its own schema) becomes an Item rather
than an asset is **unresolved**. The "shape decides" rule says single `locations`
→ asset, but a table wants Item-level `table:columns`. Shapes tried and not
adopted: per-item `dimensions`/`variables` deltas (rejected — pool/inheritance
complexity); a flat `columns[]` list (simpler, but cross-item duplication for
multi-table datasets). **Not settled.** Until then the COG/`href_template` path
is final; tables are not.

Current leaning, if real data forces a table change:

- Keep `href_template` + `dimensions[]` for addressability, partition expansion,
  and STAC Item generation. If a token appears in `href_template`, it still
  resolves through `dimensions[].values`.
- Do **not** make `dimensions[]` + `variables[]` the normal author-facing way to
  emit Table Extension `table:columns`; that makes table fields look like cube
  axes/measures and confuses Parquet authors.
- Add the simplest possible table description only if needed:
  `data[].columns[]`, with entries like `{ name, description, values?, unit? }`.
  For table assets, `data[].columns[]` would be the source for `table:columns`.
- List all logical columns for that table asset, not `additional_columns`.
  "Additional" implies an inheritance/merge rule that is harder to explain than
  a plain complete column list.
- Partition keys already declared in `dimensions[]` do not have to be repeated
  in `data[].columns[]` unless they are visible as columns when users read the
  table.
- Defer `relationships`, top-level `tables`, shared `data_model`, and
  per-asset `dimensions`/`measures` until repeated real cases justify them.
- No schema change now. Use sidecar schema/docs or separate sibling records for
  divergent Parquet tables until a concrete dataset requires first-class table
  metadata.

## Pending schema changes (COG/href\_template path only)

- Add optional `href_template` to the `data` entry def (`dataAsset`). `locations`
  stays required; the two compose.
- Encoder: `href_template` present → Items (base + template; first location
  canonical, rest alternates); absent → asset.
- **No** top-level `items[]`. **No** `data`-OR-`items` relaxation (a template
  entry keeps `data` non-empty). **No** `expand_over`, **no** `column`/`$def`.
- Tables deferred (see OPEN section above).

## Break-convention principle

Break convention freely in the **authoring YAML**; keep the **serialized
STAC/OGC output** boringly standard so tooling works. All cleverness lives in
the encoder. Directory layout is an output/hosting detail — not a standard
concern.

## Versioned URLs minted at publish time (2026-07-06)

For Hub-internal sources, the clean fix is publisher-side, not schema-side:
have the publish step mint a versioned URL for every release at publication
time — i.e., the current release is reachable both at /spam2020/ (canonical,
tracks latest) and at /spam2020-v3/ (immutable, exists from day one). That's
exactly how Zenodo and Dataverse make this problem disappear: the version
address is born with the release, not created retroactively at supersede time.
Under our model it means the encoder emits the versioned twin for the current
release too — the "snapshot" then already exists when it's superseded, and
nothing is ever copied after the fact. It's a change to the publishing
pipeline, not to the YAML or the schema.

## SEO / AI accessibility

- One **schema.org `Dataset` JSON-LD** per collection, embedded in the page
  `<head>` — the main lever for Google Dataset Search + LLM crawlers.
- **Embed STAC inline at BUILD time** (Astro frontmatter import), not a runtime
  fetch.
- `rel=alternate` → `collection.json` + Croissant; publish `sitemap.xml`; don't
  robots-block the JSON.
- Template + dimension values in the page = a compact, complete index agents can
  enumerate.
- SEO indexes the **collection** (the dataset), not 144 individual COGs.

## "Find your file" UX

- **Template-driven dropdown selectors** built from `dimensions[].values` →
  construct URL → download. Not a 144-link list, not sub-collections.
- Optional: URL query-param deep links
  (`?crop=maiz&technology=I&variable=yield`); show `s3://`/`r2://` alongside for
  compute users.
- Client-side subsetting is feasible via range requests (geotiff.js,
  georaster-layer, zarrita; Leaflet/MapLibre for bbox). Ship dropdown→download +
  map preview first; defer bbox clip-download; never full in-browser GIS. No new
  metadata required.

## Use examples (load snippets)

- **Auto-generate the basic "how to load" snippet from `media_type` + `href` at
  build** — not an asset, not a fetched link. Derived doc, not data;
  authoring/hosting it just drifts.
- Small `media_type → template` map (zarr→xarray, cog→rioxarray,
  parquet→geopandas, netcdf→xarray, csv→pandas), rendered **per
  representation**; fills URL + `.sel()` dimension names. COG snippet rides the
  same selectors as the download button (selected URL).
- **Basics generated inline; worked tutorials authored + linked out** (see
  below). Optional per-asset `code_example` override field only when a dataset
  needs non-obvious loading — YAGNI until then.

## Linking tutorials / use-cases to datasets

- **Tutorial owns the relationship.** Declare `datasets: [ids]` in tutorial
  frontmatter (typed `reference('datasets')` for build-time integrity); the
  dataset page derives its "used by" list via a build-time reverse lookup
  (`getCollection('tutorials').filter(...)`). Idiomatic Astro, \~5 lines, zero
  runtime.
- **Why this over STAC links:** ownership (a dataset can't know its future
  tutorials) + volatility (tutorials churn; STAC stays stable) + integrity
  (`reference()` fails the build on dead ids).
- **Split by canonical vs site-internal:** source DOI / paper / project site →
  STAC `additional_links` (external consumers want it); your tutorials / wikis /
  use-cases → content-collection reverse lookup, kept OUT of STAC.
- Don't build a tag taxonomy for this — explicit id reference is exact; tags are
  fuzzy and a separate concern. If machine-visibility is wanted, inject into the
  page JSON-LD from the same reverse lookup (not STAC).
- **One content collection, not parallel ones** — tutorials/use-cases/wikis
  share the same shape (reference datasets, reverse-looked-up), so use a `type`
  discriminator and group by it on the page:

```ts
const resources = defineCollection({
  schema: z.object({
    title: z.string(),
    type: z.enum(["tutorial", "use-case", "wiki"]),
    datasets: z.array(reference("datasets")),
  }),
});
```

One reference field, one reverse lookup, sections fall out of `type`.

## Use guidance vs keywords vs domain

- The canonical metadata avoids a positive free-form list of suggested uses
  because it can be misread as exhaustive or institutionally endorsed.
- Keep the axes distinct:
  - `cdh.domain` = controlled **subject area** (drives filter/sub-catalog) —
    e.g. `agricultural-production`
  - `keywords` = free **search terms** — e.g. `crop production`
  - `cdh.not_recommended_for` = explicit **uses to avoid**, with reasons and
    alternatives where available.
- Websites or AI assistants may infer and display illustrative applications from
  description, variables, coverage, resolution, domain, and limitations, but those
  examples should not be stored as canonical metadata.

## Extensions (STAC method)

Goal: any project/center adopts or extends the schema — validated, with editor
hints. STAC's model: minimal generic core, everything domain/type-specific is a
versioned extension.

### Shape

URL array declares what's in use; extension fields sit flat at top level.

```yaml
extensions:
  - https://cgiar-climate-data-hub.github.io/cdh-metadata-standard/extensions/cdh/v0.1.0/schema.json
  - https://otherorg.github.io/soil-ext/v0.1.0/schema.json
domain: [agricultural-production]   # from cdh extension
soil: { texture: clay, ph: 6.4 }    # from third-party extension
```

- **`extensions[]` = pinned schema URLs.** One uniform mechanism = "what's in
  use" + "where each schema lives" — first- and third-party identical, no
  central registry.
- **Strictness via `unevaluatedProperties:false`, not `additionalProperties`.**
  The latter can't see across `allOf`; the former can — so core + extension
  fields are allowed, typos still rejected.
- **Core becomes *open*** (drop root `additionalProperties:false`). Strictness
  lives in the **profile**, never core alone — always validate through a
  profile, even with zero extensions: `{ allOf: [core], unevaluatedProperties: false }`.
- **One extension = one self-contained schema** at `spec/extensions/<name>/vX/`,
  pinned versioned URL, defines only its own top-level field(s).

### Core vs extension split

Core = structurally universal + center-agnostic. Extension = domain/type-specific.

| Stays core         | Fields                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| Identity/lifecycle | `id` `title` `description` `version` `previous_version` `created` `updated` `cdh_schema_version` `encoding` |
| Rights/attribution | `license` `citation` `doi` `related_publications` `funding` `contact`                                       |
| Discovery          | `keywords` `resource_type`                                                                                  |
| Extent             | `spatial` `temporal`                                                                                        |
| Distribution       | `data` `additional_assets` `additional_links`                                                               |
| Provenance         | `processing`                                                                                                |

| Extension          | Current fields                                      | STAC equiv         | Applies to                    |
| ------------------ | --------------------------------------------------- | ------------------ | ----------------------------- |
| **cdh**            | `cdh.*` (domain, use\_cases, not\_recommended\_for) | Themes / custom    | all CDH records (via profile) |
| **climate**        | whole `climate.*`                                   | none native        | climate/CMIP only             |
| **datacube**       | `dimensions` + `variables`                          | Datacube Ext       | gridded/multidim/tabular      |
| **classification** | `classes`                                           | Classification Ext | categorical data              |
| **agriculture**    | `commodities`                                       | vocab / themes     | ag datasets                   |

- **`cdh` is an extension, not core** — keeps core adoptable by non-CGIAR
  centers; CGIAR governance is a layer on top.
- **Don't extract `spatial.resolution`/`crs`/`geometry_column`** — nested under
  `spatial`, flat extensions can't re-nest; proj/raster/table mapping happens in
  the encoder.
- **`resource_type` seam** — generic field, CGIAR vocab. Keep field in core with
  pluggable vocab, or move the value-list to the cdh extension. Same seam as
  `cdh`.

### Extensions don't require extensions — compose in profiles

- **Extension = mechanism** (self-contained field set, any-combo composable,
  versions independently). **Profile = policy** (which extensions + completeness
  rules).
- **No inter-extension `require`.** cdh ↔ commodities are orthogonal facets (a
  drought-hazard record has a domain, no commodity) — coupling forbids valid
  records and chains version lifecycles.
- **Escape hatch** for a *genuine structural* dep (ext B references ext A's
  fields): `if (extensions[] contains me) then (contains A)`. Rare; not
  cdh↔commodities.

### CDH profile

```json
{ "allOf": [{"$ref": "<core>"}, {"$ref": "<cdh-ext>"}],
  "properties": { "extensions": { "contains": { "const": "<cdh-ext-url>" } } },
  "required": ["extensions"],
  "unevaluatedProperties": false }
```

- Composes core + cdh ext, asserts the record declares cdh, stays strict.
- **Doubles as the authoring bundle** (bind via modeline) **and the CI gate**.
- **Mandate minimally: core + cdh (`domain`) only.** Don't blanket-require
  climate/datacube/etc — they're resource-type-conditional, so requiring them
  forbids valid records. Conditional enforcement =
  `if resource_type=X then extensions[] contains Y`, else leave to review.

### Validate + author: one composition, two consumers

- **CI = authoritative.** Compose the profile on the fly from the record's
  `extensions[]`: `{ allOf: [core, ...exts], unevaluatedProperties: false }`,
  validate once.
- **Editor hints = generated bundle.** Same `allOf`, pre-baked; bind via
  `# yaml-language-server: $schema=<bundle-url>`. LSP follows `allOf` for
  completion but binds one schema/file — can't compose from `extensions[]`
  dynamically (STAC has the same limit; bundles close it).
- **Bundles generated, never hand-written. No 2^N powerset** — one per single
  extension; named combos only on request.

### Repos — split by who authors, not by neatness

- **First-party (core + cdh/climate/datacube/classification/agriculture + CDH
  profile): this repo.** Loader already walks `spec/extensions/`; one Pages
  site; atomic changes. Version with core under the one tag for now.
- **Third-party (other centers): their repos — by design.** URL-array model =
  they publish at their own pinned URL, never touch this repo. Give them: (1)
  core at a stable URL, (2) a template (`spec/extensions/_template/`), (3) a
  short authoring guide.
- **Profiles live with whoever owns the policy** — CDH profile here; a center's
  house rules in theirs.
- **Don't pre-split first-party.** Split an extension out only on a real
  trigger: different maintainer, release cadence the core tag blocks, or
  community co-ownership.

### Future split stays cheap — IF

The eventual split (separate extension repos + a CGIAR core repo + a CDH repo
for the cdh extension + profile) is a folder-move-plus-redirect, NOT a rewrite —
*provided*:

- **Cross-boundary `$ref`s use absolute published URLs, not relative paths.**
  Boundaries = core | each extension | each profile. Extension→core and
  profile→core/exts use absolute URLs; refs *within* a component (core's
  `$defs`, an extension + its own vocab) stay relative.
- **The published URL namespace stays stable** across the move (same gh-pages
  base, or a redirect/CNAME). Refs key off URL, not repo — moving files breaks
  nothing.

Get those two right and a split is physical relocation only.

***

## Gotchas

- **`s3://` and bucket prefixes are NOT crawlable/fetchable** by SEO crawlers or
  web-fetch agents (not HTTP; object stores don't auto-list directories).
  Compute access only.
- **Discovery HTTPS invariant:** every discovery pointer (asset href,
  `href_template`, schema.org `contentUrl`, sitemap) must be HTTPS and resolve
  to the object or a single-GET index. `s3://`/`r2://` are compute *alternates*
  only, never the sole pointer.
- **Object stores don't list themselves** — the build must materialize the index
  (`items.json` / `sitemap.xml`).
- **Runtime client-side fetch hides content from non-JS crawlers/agents** (any
  origin). Build-time import = embed (good); runtime `fetch()` = bad.
- **`set:html` JSON-in-`<script>`:** escape `<` → `<` so a `</script>` in the
  data can't break out.
- **CORS on R2/S3 is mandatory** for client-side range reads (expose
  `Accept-Ranges`/`Content-Range`). #1 thing that silently breaks "all
  client-side." It's a bucket config, not code.
- **`href_template` tokens must exactly match `dimensions[].name`**
  (case-sensitive) — or be the reserved `{variable}` token (→
  `variables[].name`) — NOT the `cdh.domain` vocab field — or they can't
  resolve.
- **Keep client-side reads bounded:** preview off overviews, full-res only
  inside the bbox; large/global reads → server territory (titiler/xpublish).
- **STAC sub-catalog partitioning** is a *scale* tool (thousands+ items,
  sub-*catalogs* not sub-*collections*) — doesn't apply at 144–200; flat +
  faceting wins.
