---
schema: 1
id: n054-only-inject-analytics-ids-from-validated-productio
kind: decision
title: "Only inject analytics IDs from validated production env values"
domains: ["analytics", "security", "configuration"]
file_globs: []
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-08-10T03:36:04.271558+00:00
updated_at: 2026-08-10T03:36:04.254+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Only inject analytics IDs from validated production env values

Analytics measurement IDs must come from validated environment config and be injected only in production. This avoids exposing tracking setup in non-production builds and prevents arbitrary or malformed values from being written into the document head. Apply this whenever adding analytics or similar third-party tags that render from env-backed settings.
