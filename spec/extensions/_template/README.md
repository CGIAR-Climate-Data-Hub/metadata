# Extension template

Starter for a new CDH extension. See [`extending.md`](../../extending.md) for the full walkthrough.

To adapt it:

1. Copy `schema.json` and rename the top-level property key (`soil`) to your extension's name. All
   of your fields nest under that one key (see [the standard](../../standard.md), §4.3).
2. Replace the example fields. Keep descriptions short. Use `minLength: 1` on strings and
   `additionalProperties: false`.
3. Publish the file at a stable, version-pinned URL (e.g. GitHub Pages in your own repo) and set
   `$id` to that URL.
4. Records use it by adding that URL to `extensions[]`.

`_template/` is scaffolding and is excluded from schema loading.
