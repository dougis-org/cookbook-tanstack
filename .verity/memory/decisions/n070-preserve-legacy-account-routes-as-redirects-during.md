---
schema: 1
id: n070-preserve-legacy-account-routes-as-redirects-during
kind: decision
title: "Preserve legacy account routes as redirects during UX consolidation"
domains: ["account", "ux", "routing"]
file_globs:
  - "**/account/**"
confidence: 0.82
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T17:10:41.485423+00:00
updated_at: 2026-08-16T17:10:41.454+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Preserve legacy account routes as redirects during UX consolidation

Account UX consolidation must preserve existing route entry points as redirect-only compatibility surfaces while new behavior lives in shared ProfileSection, StatusSection, and PreferencesSection components. This avoids breaking bookmarked or externally linked account routes and applies to future account-page refactors.
