---
schema: 1
id: n037-use-a-printfooter-slot-on-recipedetail-for-cookboo
kind: decision
title: "Use a printFooter slot on RecipeDetail for cookbook-only trailing content"
domains: ["recipes", "print-layout", "cookbook"]
file_globs: []
confidence: 0.83
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-16T05:26:16.453313+00:00
updated_at: 2026-07-16T05:26:16.352+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use a printFooter slot on RecipeDetail for cookbook-only trailing content

When cookbook print output needs extra trailing material, add it through a dedicated `printFooter` slot on `RecipeDetail` instead of embedding that content in shared recipe markup. This keeps the main recipe rendering path single-sourced while letting print-only cookbook pages inject footer/page-number content without affecting normal recipe views. Apply this anywhere a shared recipe component must support print-specific trailing UI.
