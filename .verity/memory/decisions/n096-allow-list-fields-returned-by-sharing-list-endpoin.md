---
schema: 1
id: n096-allow-list-fields-returned-by-sharing-list-endpoin
kind: decision
title: "Allow-list fields returned by sharing-list endpoints"
domains: ["sharing", "privacy", "data-access"]
file_globs: []
confidence: 0.72
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "3d5220e8-d2f0-46d0-81e9-814f44b0b25a"
task: "8e69a7e5-43d6-4d85-995e-56872c8c3390"
run: "run-20260926163256-29beb095"
created_at: 2026-09-26T16:33:04.979587+00:00
updated_at: 2026-09-26T16:33:04.886+00:00
related: ["n091-retain-sharing-grants-across-owner-tier-changes", "n092-exclude-pending-verification-content-from-shared-o"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Allow-list fields returned by sharing-list endpoints

Sharing-list responses should return only grant fields and the other party’s identifier and name. These endpoints expose relationships between users, so returning full user or grant records can unintentionally disclose sensitive attributes such as email addresses or account tiers. Apply this constraint when adding or changing sharing-list responses; explicitly select the fields needed by the caller rather than relying on broad document projections.

## Related

**Related:**
- [[n091-retain-sharing-grants-across-owner-tier-changes]]
- [[n092-exclude-pending-verification-content-from-shared-o]]

