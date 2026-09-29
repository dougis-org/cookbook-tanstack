---
schema: 1
id: n074-preserve-legacy-account-routes-as-authenticated-re
kind: decision
title: "Preserve legacy account routes as authenticated redirects"
domains: ["routing", "account", "backward-compatibility"]
file_globs:
  - "src/routes/**/account*.tsx"
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T23:00:20.773255+00:00
updated_at: 2026-08-16T23:00:20.745+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Preserve legacy account routes as authenticated redirects

Legacy account entry points must remain authenticated redirects to the consolidated `/account` route, implemented as named route components. This preserves existing bookmarks, links, and integrations while satisfying the router’s route-export conventions; future account-page consolidation should retain the same compatibility boundary rather than removing aliases outright.
