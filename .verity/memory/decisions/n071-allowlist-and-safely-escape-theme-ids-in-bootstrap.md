---
schema: 1
id: n071-allowlist-and-safely-escape-theme-ids-in-bootstrap
kind: decision
title: "Allowlist and safely escape theme IDs in bootstrap scripts"
domains: ["security", "themes", "hydration"]
file_globs: []
confidence: 0.91
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T17:27:00.723299+00:00
updated_at: 2026-08-16T17:27:00.696+00:00
related: ["n044-reconcile-theme-context-with-server-session-after"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Allowlist and safely escape theme IDs in bootstrap scripts

When embedding theme state into an executable bootstrap script, serialize only IDs that pass the theme allowlist and escape `<` in the serialized output. This prevents localStorage or configuration-controlled values from breaking out of the script context and creating script-injection risk; apply the rule to all server-rendered theme bootstrap data.

## Related

**Related:**
- [[n044-reconcile-theme-context-with-server-session-after]]

