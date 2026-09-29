---
schema: 1
id: n072-require-both-shell-visibility-and-router-idle-befo
kind: decision
title: "Require both shell visibility and router idle before treating pages as hydrated"
domains: ["testing", "hydration", "react-router"]
file_globs:
  - "**/e2e/**"
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T17:43:02.609846+00:00
updated_at: 2026-08-16T17:43:02.579+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Require both shell visibility and router idle before treating pages as hydrated

Hydration-readiness checks must retain both the app-shell visibility gate and the router-idle marker. Shell visibility verifies stylesheet and boot-loader readiness, while router idle verifies React and route completion; either gate alone can allow tests to proceed before the application is actually ready. Apply this when defining end-to-end waits for hydrated pages.
