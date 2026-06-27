---
schema: 1
id: n018-keep-tier-entitlement-checks-centralized-in-shared
kind: decision
title: "Keep tier entitlement checks centralized in shared policy code"
domains: ["billing", "entitlements"]
file_globs:
  - "**/tier-entitlements/**"
confidence: 0.9
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-25T23:16:24.812867+00:00
updated_at: 2026-06-25T23:16:24.812867+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep tier entitlement checks centralized in shared policy code

Tier access decisions must be derived from the shared entitlement policy, with hooks/components acting only as thin adapters. This avoids diverging logic when plans or limits change and ensures a single source of truth for future tier updates. Apply this anywhere UI or server code needs to answer “what does this plan include?” rather than duplicating conditionals in the caller.
