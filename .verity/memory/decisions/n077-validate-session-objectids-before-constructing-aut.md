---
schema: 1
id: n077-validate-session-objectids-before-constructing-aut
kind: decision
title: "Validate session ObjectIds before constructing authorization filters"
domains: ["account", "authorization", "mongodb", "security"]
file_globs:
  - "**/account/**"
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-20T00:07:51.831666+00:00
updated_at: 2026-08-20T00:07:51.739+00:00
related: ["n076-reject-external-avatar-urls-unless-an-image-provid"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Validate session ObjectIds before constructing authorization filters

Authorization queries must use structured MongoDB filter objects, and session-derived ObjectId values must be validated before a query is issued. This preserves parameterized query semantics and prevents malformed or attacker-controlled session identifiers from reaching authorization lookups. Apply this to account and other authenticated data-access paths that derive filters from session state.

## Related

**Related:**
- [[n076-reject-external-avatar-urls-unless-an-image-provid]]

