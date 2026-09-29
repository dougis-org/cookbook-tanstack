---
schema: 1
id: n101-project-only-public-fields-from-joined-users-in-sh
kind: decision
title: "Project only public fields from joined users in sharing listings"
domains: ["sharing", "privacy"]
file_globs: []
confidence: 0.79
status: active
source: extractor
created_by: decision-promoter@gpt-6-luna
session: "1f5f0a27-7f94-4d07-8b01-2d4d941c167c"
task: "51ac8128-52fa-4658-b060-ce9c664f31f4"
run: "run-20260927014049-ca375c42"
created_at: 2026-09-27T01:40:56.543267+00:00
updated_at: 2026-09-27T01:40:56.452+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Project only public fields from joined users in sharing listings

Sharing-listing aggregations must explicitly project the fields their responses need rather than return joined Better-Auth user documents. Joined records can contain private data such as email addresses and account tiers; limiting the projection prevents those fields from leaking when listing responses evolve. Apply this when building aggregation results for sharing listings.
