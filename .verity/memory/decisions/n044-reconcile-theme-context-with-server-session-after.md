---
schema: 1
id: n044-reconcile-theme-context-with-server-session-after
kind: decision
title: "Reconcile theme context with server session after hydration"
domains: ["frontend", "theme", "hydration", "auth"]
file_globs:
  - "src/**/ThemeContext.*"
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-17T14:59:08.924178+00:00
updated_at: 2026-07-17T14:59:08.476+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Reconcile theme context with server session after hydration

When theme can be set before hydration, the client must re-sync ThemeContext from the server session after mount so saved preference changes picked up during login/session refresh are not lost. This preserves a flash-free first paint while still letting authenticated state become the source of truth once the app is hydrated. Apply this anywhere theme is derived from both client-side prehydration state and server session data.
