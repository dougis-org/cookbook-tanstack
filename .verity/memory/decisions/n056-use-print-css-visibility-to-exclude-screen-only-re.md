---
schema: 1
id: n056-use-print-css-visibility-to-exclude-screen-only-re
kind: decision
title: "Use print CSS visibility to exclude screen-only recipe sections from print"
domains: ["recipes", "printing", "responsive-ui"]
file_globs:
  - "src/**/components/**/*RecipeDetail*"
  - "src/**/components/**/*print*"
confidence: 0.78
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T00:27:15.869922+00:00
updated_at: 2026-08-16T00:27:15.842+00:00
related: ["n055-resolve-print-preferences-at-route-boundaries-befo"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use print CSS visibility to exclude screen-only recipe sections from print

Shared recipe content that must remain visible on screen but be excluded from printed output should use print-specific CSS visibility, such as print:hidden, rather than conditional rendering. Conditional removal can alter the screen-rendered UI and create divergent content trees; this rule applies to screen/print variants of recipe sections.

## Related

**Related:**
- [[n055-resolve-print-preferences-at-route-boundaries-befo]]

