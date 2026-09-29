---
schema: 1
id: n075-scope-public-recipe-ad-eligibility-with-explicit-p
kind: decision
title: "Scope public recipe ad eligibility with explicit PageLayout roles"
domains: ["recipes", "ads", "routing"]
file_globs: []
confidence: 0.89
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-17T19:16:38.015951+00:00
updated_at: 2026-08-17T19:16:37.978+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Scope public recipe ad eligibility with explicit PageLayout roles

Recipe-detail pages must pass the public-content ad role explicitly at every PageLayout boundary rather than relying on PageLayout’s default. This keeps ad eligibility changes scoped to the public recipe route and prevents unrelated protected routes from inheriting public-content behavior. Apply this when changing layout usage in the recipe-detail page subsystem.
