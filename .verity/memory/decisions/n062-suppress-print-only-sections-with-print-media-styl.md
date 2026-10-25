---
schema: 1
id: n062-suppress-print-only-sections-with-print-media-styl
kind: decision
title: "Suppress print-only sections with print-media styling, not conditional screen removal"
domains: ["print-preferences", "media-print", "recipe-detail"]
file_globs: []
confidence: 0.8
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T01:02:47.673457+00:00
updated_at: 2026-08-16T01:02:47.649+00:00
related: ["n061-resolve-user-scoped-print-preferences-outside-pres"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Suppress print-only sections with print-media styling, not conditional screen removal

Use print-media styling such as `print:hidden` to suppress preference-controlled sections rather than conditionally removing them from the rendered screen tree. Print preferences must affect printed output without changing screen rendering, component structure, or client-side behavior; apply this to user-configurable print sections in recipe views.

## Related

**Related:**
- [[n061-resolve-user-scoped-print-preferences-outside-pres]]

