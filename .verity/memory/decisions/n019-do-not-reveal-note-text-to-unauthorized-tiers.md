---
schema: 1
id: n019-do-not-reveal-note-text-to-unauthorized-tiers
kind: decision
title: "Do not reveal note text to unauthorized tiers"
domains: ["authorization", "privacy", "billing"]
file_globs: []
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-26T23:17:36.75785+00:00
updated_at: 2026-06-26T23:17:36.649+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Do not reveal note text to unauthorized tiers

When a caller is below the tier required to read a note, the API may acknowledge that the note exists but must not return the note body. This preserves upgrade prompts and item discovery without leaking private content. Apply this anywhere note access is tier-gated: existence checks can be exposed, but note content itself is sensitive and must remain hidden unless the caller has read entitlement.
