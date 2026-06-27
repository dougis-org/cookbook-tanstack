---
schema: 1
id: n020-verify-recipe-access-before-creating-or-updating-n
kind: decision
title: "Verify recipe access before creating or updating notes"
domains: ["authorization", "data-integrity", "recipes"]
file_globs:
  - "src/server/**/recipe*"
confidence: 0.85
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-26T23:17:37.160019+00:00
updated_at: 2026-06-26T23:17:37.061+00:00
related: ["n019-do-not-reveal-note-text-to-unauthorized-tiers"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Verify recipe access before creating or updating notes

Before upserting a note, the server must confirm the caller owns the recipe or is allowed to see it. Otherwise note writes could target recipes the user should not be able to reference, which is both an authorization bug and a data-integrity issue. This constraint applies to any note mutation keyed by recipe identity, not just the current endpoint.

## Related

**Related:**
- [[n019-do-not-reveal-note-text-to-unauthorized-tiers]]

