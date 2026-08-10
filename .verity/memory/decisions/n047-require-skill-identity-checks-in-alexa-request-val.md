---
schema: 1
id: n047-require-skill-identity-checks-in-alexa-request-val
kind: decision
title: "Require skill identity checks in Alexa request validation"
domains: ["security", "voice-assistant", "authentication"]
file_globs: []
confidence: 0.93
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-08-04T22:52:43.684025+00:00
updated_at: 2026-08-04T22:52:43.568+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Require skill identity checks in Alexa request validation

Signature verification is necessary but not sufficient for Alexa traffic: it only establishes that the request came from Alexa infrastructure, not that it was intended for this skill. Any Alexa route that accepts signed requests must also verify the skill/application identity and fail closed when the identity does not match, otherwise a valid Alexa-signed request for another skill could be processed incorrectly.
