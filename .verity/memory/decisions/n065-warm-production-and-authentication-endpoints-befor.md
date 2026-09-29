---
schema: 1
id: n065-warm-production-and-authentication-endpoints-befor
kind: decision
title: "Warm production and authentication endpoints before production-mode E2E tests"
domains: ["ci", "e2e", "hydration", "playwright"]
file_globs: []
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T15:27:11.337938+00:00
updated_at: 2026-08-16T15:27:11.305+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Warm production and authentication endpoints before production-mode E2E tests

E2E workflows should explicitly warm the production server and authentication endpoint before running browser tests. Lazy-loaded server modules can otherwise make the first hydration-dependent requests exceed test timeouts, producing false failures rather than exposing product regressions. Apply this to workflows that launch the production-mode app for Playwright tests.
