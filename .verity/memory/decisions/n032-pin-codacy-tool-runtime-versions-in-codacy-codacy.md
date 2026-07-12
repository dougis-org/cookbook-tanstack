---
schema: 1
id: n032-pin-codacy-tool-runtime-versions-in-codacy-codacy
kind: decision
title: "Pin Codacy tool/runtime versions in .codacy/codacy.yaml"
domains: ["ci", "code-quality", "tooling"]
file_globs:
  - ".codacy/codacy.yaml"
confidence: 0.8
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-06T23:02:33.292104+00:00
updated_at: 2026-07-06T23:02:33.195+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Pin Codacy tool/runtime versions in .codacy/codacy.yaml

Codacy analysis must use explicitly declared tool/runtime versions so scans stay reproducible and don’t silently change when the hosted default environment moves. Keep this configuration centralized in .codacy/codacy.yaml rather than spreading version assumptions elsewhere. Apply this whenever we add or update Codacy scanning, especially for rules whose behavior depends on the scanner runtime or bundled tools.
