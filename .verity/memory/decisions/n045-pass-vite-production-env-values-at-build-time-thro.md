---
schema: 1
id: n045-pass-vite-production-env-values-at-build-time-thro
kind: decision
title: "Pass Vite production env values at build time through Fly build args and Docker ARG/ENV"
domains: ["deploy", "frontend", "secrets"]
file_globs:
  - "fly.toml"
  - "Dockerfile"
confidence: 0.93
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-19T23:42:18.367375+00:00
updated_at: 2026-07-19T23:42:18.34+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Pass Vite production env values at build time through Fly build args and Docker ARG/ENV

Vite reads production environment values during the build, not at container runtime. For deploys that produce the frontend bundle, those values must be supplied explicitly via Fly build arguments and wired through Docker ARG/ENV, otherwise the built assets will bake in missing or stale configuration. Apply this anywhere we build the app image for production or a domain cutover that changes frontend runtime endpoints.
