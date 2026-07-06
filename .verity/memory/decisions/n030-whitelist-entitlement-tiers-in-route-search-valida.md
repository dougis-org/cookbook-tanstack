---
schema: 1
id: n030-whitelist-entitlement-tiers-in-route-search-valida
kind: decision
title: "Whitelist entitlement tiers in route search validation"
domains: ["routing", "entitlements", "validation"]
file_globs:
  - "src/routes/**"
confidence: 0.78
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-05T17:00:15.666058+00:00
updated_at: 2026-07-05T17:00:15.203+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Whitelist entitlement tiers in route search validation

Route search params that select an entitlement tier must be validated with `validateSearch` against the known tier set. This prevents arbitrary query values from being treated as valid targets and keeps client-side state aligned with the same tier constraints enforced elsewhere. Apply this anywhere router search state is used to drive entitlement-specific UI or actions, especially in pricing/checkout flows.
