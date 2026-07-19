---
schema: 1
id: n040-seed-theme-state-in-playwright-before-navigation-f
kind: decision
title: "Seed theme state in Playwright before navigation for pre-hydration cases"
domains: ["testing", "playwright", "theme", "hydration"]
file_globs: []
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-16T18:46:45.963047+00:00
updated_at: 2026-07-16T18:46:45.854+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Seed theme state in Playwright before navigation for pre-hydration cases

When an assertion depends on the page’s pre-hydration state, the test must seed theme data through Playwright init scripts before navigation. This is required to verify no-flash rendering and theme-migration behavior, which cannot be exercised reliably after the app has already hydrated. Use this pattern for browser tests that need the initial DOM, storage, or theme state to exist before first paint.
