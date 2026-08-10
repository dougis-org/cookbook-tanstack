---
schema: 1
id: n053-wait-for-hydration-via-an-explicit-dom-readiness-m
kind: decision
title: "Wait for hydration via an explicit DOM readiness marker, not networkidle or sleeps"
domains: ["testing", "hydration", "theme"]
file_globs: []
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-08-09T21:19:31.167307+00:00
updated_at: 2026-08-09T21:19:31.144+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Wait for hydration via an explicit DOM readiness marker, not networkidle or sleeps

Hydration-sensitive tests must wait on an explicit page readiness signal exposed in the DOM instead of relying on `networkidle` or fixed delays. Network-idle heuristics are brittle under client-side routing and background requests, and sleeps make readiness nondeterministic. Use the marker when a test needs to observe that the app has finished hydrating before asserting theme- or session-dependent UI state.
