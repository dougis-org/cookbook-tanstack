---
schema: 1
id: n055-resolve-print-preferences-at-route-boundaries-befo
kind: decision
title: "Resolve print preferences at route boundaries before rendering recipe details"
domains: ["recipes", "print-preferences", "component-boundaries"]
file_globs:
  - "src/**/routes/**/*recipe*"
  - "src/**/components/**/*RecipeDetail*"
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T00:27:15.778054+00:00
updated_at: 2026-08-16T00:27:15.75+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Resolve print preferences at route boundaries before rendering recipe details

Route components should resolve the current user’s print preferences once, including malformed or missing session values, and pass a typed result to RecipeDetail. This keeps the detail component presentational and prevents duplicated or inconsistent preference parsing across render paths. Apply this whenever route-level data feeds recipe-detail views.
