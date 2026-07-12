---
schema: 1
id: n034-filter-sources-on-the-server-and-page-initial-sour
kind: decision
title: "Filter sources on the server and page initial source loads"
domains: ["sources", "search", "pagination"]
file_globs: []
confidence: 0.91
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-06T23:57:20.862169+00:00
updated_at: 2026-07-06T23:57:20.767+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Filter sources on the server and page initial source loads

Source lists must be queried and filtered server-side, and the UI should fetch only the first page (about 100 items) up front. This prevents loading large source sets into the client unnecessarily and keeps search/filter results consistent with the authoritative dataset. When no sort is applied, the list may continue via infinite scroll pagination; other query modes should not assume a full client-side source cache.
