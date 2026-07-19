---
schema: 1
id: n038-keep-recipedetail-presentational-resolve-personal
kind: decision
title: "Keep RecipeDetail presentational; resolve personal notes in the route"
domains: ["recipes", "routing", "react"]
file_globs:
  - "src/routes/recipes/**"
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-16T14:14:15.496293+00:00
updated_at: 2026-07-16T14:14:15.405+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep RecipeDetail presentational; resolve personal notes in the route

`RecipeDetail` should stay a pure display component and receive `personalNote` from the route/page layer. That keeps auth, tier checks, and note-fetching logic out of the reusable detail component, which is important because the same view may be rendered in other contexts that do not have the current user’s private note available. If a change needs user-specific data, resolve it before composition and pass it down as a prop.
