---
schema: 1
id: n076-reject-external-avatar-urls-unless-an-image-provid
kind: decision
title: "Reject external avatar URLs unless an image provider is explicitly allowlisted"
domains: ["account", "authentication", "security", "avatar"]
file_globs:
  - "**/account/**"
confidence: 0.91
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-19T01:30:32.035357+00:00
updated_at: 2026-08-19T01:30:32.008+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Reject external avatar URLs unless an image provider is explicitly allowlisted

Account identity UI must not turn session-provided avatar URLs into browser image sources unless a trusted provider has been explicitly configured. An empty allowlist is the safe default because session image values may be untrusted; render a local placeholder instead. Apply this to all account/profile avatar rendering and related URL validation.
