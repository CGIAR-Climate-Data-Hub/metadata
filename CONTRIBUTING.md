# Contributing

Thanks for your interest in contributing to the CGIAR CDH metadata standard. This project is still
pre-1.0 and breaking changes to the schema and controlled vocabularies are expected.

## Reporting issues

Please open an issue for bugs, unclear specifications, or proposed additions to the schema or
controlled vocabularies. Include:

- a short description of the problem or proposal,
- the affected schema, vocabulary, or document, and
- an example (input data, expected vs. actual behaviour) where relevant.

## Development setup

```sh
git clone https://github.com/CGIAR-Climate-Data-Hub/metadata.git
cd metadata
npm install
```

Useful scripts:

- `npm test`: formatting, markdown lint, schemas, vocabularies, YAML, and negative fixtures.
- `npm run check`: schemas, vocabularies, bundled profile, YAML, and negative fixtures.
- `npm run format`: format Markdown, JSON, and YAML.

This repository also uses [prek](https://prek.j178.dev/) for the hooks in `.pre-commit-config.yaml`.
Install it once:

```sh
prek install
```

Hooks run on `git commit`. To run them manually:

```sh
prek run --all-files
```

## Making changes

- Create a branch off `main` for your change.
- Keep each pull request focused on a single logical change.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (e.g.
  `feat:`, `fix:`, `docs:`, `style:`, `chore:`).
- Add an entry under `## [Unreleased]` in `CHANGELOG.md` describing the change.
- Run `npm test` before opening a pull request.

## Schema and vocabulary changes

Changes to the schema or controlled vocabularies should explain the rationale in the pull request
description. While the project is pre-1.0, breaking schema changes are allowed but will bump the
minor version.

## License

By contributing, you agree that your contributions will be licensed under the terms of the project's
[LICENSE](LICENSE).
