---
schema: 1
id: n048-scope-third-party-sharing-to-connected-oauth-clien
kind: decision
title: "Scope third-party sharing to connected OAuth clients in the privacy policy"
domains: ["privacy", "policy", "oauth"]
file_globs:
  - "**/privacy-policy.*"
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-08-04T23:05:36.703472+00:00
updated_at: 2026-08-04T23:05:36.597+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Scope third-party sharing to connected OAuth clients in the privacy policy

The privacy policy should describe third-party data sharing only in the context of connected OAuth clients. This keeps that disclosure separate from the app’s transactional email provider flow, which is a different data path and should not be implied to share user data with connected services. Apply this rule whenever the policy explains external sharing so the wording stays accurate and does not overstate what is sent to third parties.
