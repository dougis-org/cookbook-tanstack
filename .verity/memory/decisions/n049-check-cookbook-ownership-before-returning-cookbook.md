---
schema: 1
id: n049-check-cookbook-ownership-before-returning-cookbook
kind: decision
title: "Check cookbook ownership before returning cookbook details"
domains: ["auth", "security", "cookbooks"]
file_globs:
  - "src/**/cookbook*/**"
  - "src/**/cookbooks/**"
confidence: 0.79
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-08-08T01:24:30.049106+00:00
updated_at: 2026-08-08T01:24:29.938+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Check cookbook ownership before returning cookbook details

When serving cookbook detail data, the handler must verify the requester owns or is otherwise authorized for that cookbook before any details are returned. This is a security constraint, not a presentation choice: skipping the ownership check would leak protected cookbook data to unauthorized users. Apply this pattern anywhere cookbook details are fetched or rendered from a server endpoint.
