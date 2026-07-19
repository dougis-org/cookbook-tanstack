---
schema: 1
id: n039-reuse-the-same-trpc-query-options-to-keep-the-priv
kind: decision
title: "Reuse the same TRPC query options to keep the private-note cache key stable"
domains: ["react-query", "recipes", "trpc"]
file_globs: []
confidence: 0.8
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-16T14:14:48.690148+00:00
updated_at: 2026-07-16T14:14:48.593+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Reuse the same TRPC query options to keep the private-note cache key stable

When the same private note is fetched from more than one place, use the shared `trpc.privateRecipeNotes.get.queryOptions({ recipeId })` helper rather than building a second query config by hand. React Query treats the query options as the cache identity; if the call sites diverge, the request will not dedupe and the note can be fetched twice. Apply this anywhere the route and a nested consumer need the same private-note data.
