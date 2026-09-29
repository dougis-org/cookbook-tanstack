---
schema: 1
id: n104-resolve-shared-cookbook-recipes-at-read-time
kind: decision
title: "Resolve shared cookbook recipes at read time"
domains: ["cookbooks", "authorization", "data-integrity"]
file_globs: []
confidence: 0.79
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "e018b53a-776a-4057-8a70-e89b65b8794e"
task: "aa957652-e74b-48a2-a9db-eb432b161447"
run: "run-20260928214955-667303fc"
created_at: 2026-09-28T21:50:03.505353+00:00
updated_at: 2026-09-28T21:50:03.397+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Resolve shared cookbook recipes at read time

For cookbook entries that reference another owner's recipe, resolve the recipe at read time rather than copying its content. This keeps authorized entries current when the owner edits a recipe and avoids serving stale or retained content after access is revoked, the owner is downgraded, or the recipe is soft-deleted. Apply this to cross-owner cookbook references; unavailable references should not expose recipe content.
