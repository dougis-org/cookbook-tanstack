---
schema: 1
id: n052-persist-alexa-conversation-state-by-alexa-user-id
kind: decision
title: "Persist Alexa conversation state by Alexa user ID"
domains: ["alexa", "state-management", "backend"]
file_globs: []
confidence: 0.9
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-08-08T04:57:58.711486+00:00
updated_at: 2026-08-08T04:57:58.691+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Persist Alexa conversation state by Alexa user ID

When Alexa flows need to survive session loss or span multiple turns, store progress against the Alexa user ID rather than the transient request/session object. Session-bound state will be lost between invocations, which breaks step navigation and can mix progress across callers. This applies to any Alexa-backed workflow that needs caller-scoped continuity across requests.
