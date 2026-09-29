---
schema: 1
id: n081-escape-user-search-text-before-constructing-mongod
kind: decision
title: "Escape user search text before constructing MongoDB regex filters"
domains: ["users", "search", "mongodb", "security"]
file_globs: []
confidence: 0.93
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-21T23:25:45.879758+00:00
updated_at: 2026-08-21T23:25:45.78+00:00
related: ["n078-use-the-shared-better-auth-collection-helper-for-u", "n080-bound-and-trim-users-router-search-input-before-qu"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Escape user search text before constructing MongoDB regex filters

User-provided search text must be regex-escaped before it is inserted into MongoDB filter objects. Without escaping, regex metacharacters can alter matching semantics, broaden results, or cause unexpected query behavior; escaping preserves the intended literal prefix-search contract. This applies to all users-router search fields that are translated into regular expressions, including future additions.

## Related

**Related:**
- [[n078-use-the-shared-better-auth-collection-helper-for-u]]
- [[n080-bound-and-trim-users-router-search-input-before-qu]]

