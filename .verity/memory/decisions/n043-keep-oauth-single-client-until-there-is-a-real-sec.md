---
schema: 1
id: n043-keep-oauth-single-client-until-there-is-a-real-sec
kind: decision
title: "Keep OAuth single-client until there is a real second consumer"
domains: ["auth", "oauth", "architecture"]
file_globs: []
confidence: 0.82
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-17T04:40:36.872204+00:00
updated_at: 2026-07-17T04:40:36.784+00:00
related: ["n042-keep-better-auth-configuration-centralized-and-sha"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep OAuth single-client until there is a real second consumer

Do not introduce a multi-client OAuth abstraction just to anticipate future integrations. Better Auth’s existing provider model already covers the current client, so extra indirection would add complexity without solving a present constraint. Revisit the design only when a second downstream consumer is real and has distinct requirements; at that point the added structure is justified by actual integration pressure, not speculation.

## Related

**Related:**
- [[n042-keep-better-auth-configuration-centralized-and-sha]]

