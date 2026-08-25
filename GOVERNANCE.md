# Governance

This document describes who maintains the CDH metadata standard and how changes to the schema,
controlled vocabularies, and related documentation are proposed, reviewed, and accepted.

The standard is pre-1.0, so governance is intentionally lightweight while it is being tested.
Section _To be formalized_ requires Climate Data Hub program input and will be expanded as the Hub
matures.

## Scope

Governance covers everything published from this repository:

- the metadata input schema (`spec/schemas/`),
- controlled vocabularies (`vocab/`),
- STAC and OGC API Records mappings and crosswalks (`spec/`), and
- the authoring guide, standard, and templates.

## Roles

- **Maintainers** own the schema, vocabularies, and mappings. They review and merge changes, cut
  releases, and are the final decision-makers on what enters the standard. Current maintainers are
  listed in [`.github/CODEOWNERS`](.github/CODEOWNERS).
- **Contributors** — CGIAR programs, partners, and external users — propose changes via issues and
  pull requests. No special status is required to contribute.

## Changing the schema or vocabularies

1. Open an issue describing the problem or proposal (see [CONTRIBUTING.md](CONTRIBUTING.md)).
2. Submit a pull request. Schema and vocabulary changes must explain their rationale in the PR
   description, and vocabulary additions must record their source (see below).
3. A maintainer reviews the change; `CODEOWNERS` requires maintainer approval before merge.
4. Accepted changes are versioned together under a single tag (see
   [Versioning](README.md#versioning)). While pre-1.0, breaking changes bump the minor version.

Most changes proceed by lazy consensus — if no maintainer objects within a reasonable review window,
the change can merge. Disagreements are resolved by the maintainers.

## Where vocabularies come from

Each vocabulary file records its origin in `scheme.source_scheme` (for example AGROVOC, schema.org,
or UN M49), and every concept carries the source `code` and `uri` linking back to the authoritative
term. The rationale for a specific addition or change lives in the issue or pull request that
introduced it. New vocabularies should reuse an existing authoritative scheme wherever one fits
rather than minting CDH-local terms.

## To be formalized

These are open and need Climate Data Hub program input rather than a repository decision:

- a named cross-program stewardship structure and a review process for program-level buy-in
- alignment with future CDH operational and documentation layers
- Data governance model
