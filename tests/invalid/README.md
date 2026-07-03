# Negative fixtures

Every record in this directory MUST fail validation - each targets one rule class named by its file.
They guard the strictness of the schemas and the cross-field checks: if a schema or check is
accidentally loosened, the fixture that stops failing turns CI red.

Run via `npm run check-invalid` (part of `npm run check`), which validates the directory with
`--expect-fail`.
