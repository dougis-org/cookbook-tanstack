---
schema: 1
id: n059-fail-open-when-print-preference-session-fields-are
kind: decision
title: "Fail open when print-preference session fields are missing or malformed"
domains: ["printing", "session-state", "resilience"]
file_globs: []
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T01:01:59.936451+00:00
updated_at: 2026-08-16T01:01:59.91+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Fail open when print-preference session fields are missing or malformed

Print-preference resolution must treat malformed or absent session preference fields as strict false, so invalid input does not suppress printable content. This fail-open rule applies to request-aware print-preference resolvers and prevents accidental omission when session state is incomplete or cannot be trusted.
