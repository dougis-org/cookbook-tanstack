---
schema: 1
id: n041-keep-hydration-and-styling-dependent-theme-checks
kind: decision
title: "Keep hydration- and styling-dependent theme checks in E2E tests"
domains: ["testing", "e2e", "hydration", "theme"]
file_globs: []
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-16T18:46:46.465427+00:00
updated_at: 2026-07-16T18:46:46.361+00:00
related: ["n040-seed-theme-state-in-playwright-before-navigation-f"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Keep hydration- and styling-dependent theme checks in E2E tests

Theme behavior that depends on full-page hydration, localStorage, or actual DOM styling must be covered in browser E2E tests rather than unit tests. Unit tests cannot reproduce first-paint timing or CSS application accurately enough to validate no-flash and migration scenarios, so moving these checks lower would miss the real failure mode. Apply this rule whenever the behavior under test spans hydration, persisted browser state, and rendered styling.

## Related

**Related:**
- [[n040-seed-theme-state-in-playwright-before-navigation-f]]

