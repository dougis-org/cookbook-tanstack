---
schema: 1
id: n060-use-print-css-to-suppress-configured-sections-with
kind: decision
title: "Use print CSS to suppress configured sections without removing screen content"
domains: ["printing", "css", "presentation"]
file_globs: []
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T01:02:00.044102+00:00
updated_at: 2026-08-16T01:01:59.996+00:00
related: ["n059-fail-open-when-print-preference-session-fields-are"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use print CSS to suppress configured sections without removing screen content

Print-only preferences must be enforced with print CSS rather than removing sections from the rendered document. This keeps the complete content available for normal screen interaction while limiting suppression to the print medium, and applies to components that render configurable printable sections.

## Related

**Related:**
- [[n059-fail-open-when-print-preference-session-fields-are]]

