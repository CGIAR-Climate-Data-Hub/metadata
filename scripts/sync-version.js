#!/usr/bin/env node
// Runs from the npm `version` lifecycle hook, after npm has bumped
// package.json but before it commits. Rewrites the old release tag
// (v<MAJOR>.<MINOR>.<PATCH>) to the new one across all tracked files except
// the CHANGELOG (which keeps historical references), then regenerates the
// derived schemas so their $ids pick up the new version.
//
// npm only commits what is staged when the hook exits, so changed files are
// staged here; `npm version` refuses to run on a dirty tree, which keeps
// unrelated edits out of the release commit.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf-8" });

const oldTag = `v${JSON.parse(git("show", "HEAD:package.json")).version}`;
const newTag = `v${JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8")).version}`;
if (oldTag === newTag) {
  console.log(`Version unchanged (${newTag}); nothing to sync.`);
  process.exit(0);
}

let files = [];
try {
  files = git("grep", "-lF", oldTag, "--", ":!CHANGELOG.md").trim().split("\n").filter(Boolean);
} catch {
  // git grep exits 1 on no matches
}

for (const file of files) {
  const path = resolve(ROOT, file);
  writeFileSync(path, readFileSync(path, "utf-8").replaceAll(oldTag, newTag));
}
console.log(`${oldTag} -> ${newTag} in ${files.length} file(s).`);

execFileSync("node", [resolve(ROOT, "scripts/generate-vocab-schemas.js")], {
  cwd: ROOT,
  stdio: "inherit",
});
execFileSync("node", [resolve(ROOT, "scripts/bundle-profile.js")], { cwd: ROOT, stdio: "inherit" });

git("add", "-u");
