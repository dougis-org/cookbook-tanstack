---
schema: 1
id: n025-coerce-url-query-params-before-numeric-validation
kind: decision
title: "Coerce URL query params before numeric validation"
domains: ["routing", "validation", "zod"]
file_globs:
  - "src/**/routes/**"
  - "src/**/admin/**"
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-28T14:43:44.949292+00:00
updated_at: 2026-06-28T14:43:44.856+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Coerce URL query params before numeric validation

URL search params arrive as strings, so numeric page inputs must be coerced before validation. Using `z.coerce.number()` prevents valid query values from being rejected or misparsed just because they came from the router as text. Apply this anywhere route code validates pagination or other numeric query parameters from `location.search`/router state.
