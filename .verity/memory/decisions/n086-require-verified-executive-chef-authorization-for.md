---
schema: 1
id: n086-require-verified-executive-chef-authorization-for
kind: decision
title: "Require verified executive-chef authorization for authenticated user search"
domains: ["users", "authorization", "authentication"]
file_globs: []
confidence: 0.87
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-21T23:47:08.461507+00:00
updated_at: 2026-08-21T23:47:08.351+00:00
related: ["n078-use-the-shared-better-auth-collection-helper-for-u", "n081-escape-user-search-text-before-constructing-mongod"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Require verified executive-chef authorization for authenticated user search

User-search procedures must require both a verified session and executive-chef authorization before processing search input or returning user data. This ordering prevents unverified or insufficiently privileged callers from reaching user-data logic and preserves the endpoint’s confidentiality boundary. Apply this rule to authenticated user-search routes in the users router.

## Related

**Related:**
- [[n078-use-the-shared-better-auth-collection-helper-for-u]]
- [[n081-escape-user-search-text-before-constructing-mongod]]

