---
schema: 1
id: n027-grant-reusable-workflows-only-the-permissions-they
kind: decision
title: "Grant reusable workflows only the permissions they actually need"
domains: ["ci/cd", "github-actions"]
file_globs:
  - ".github/workflows/*.yml"
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-01T01:37:24.237179+00:00
updated_at: 2026-07-01T01:37:24.137+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Grant reusable workflows only the permissions they actually need

When a workflow calls a reusable GitHub Actions workflow, the caller must declare only the permissions that called workflow requires. This keeps the caller/callee contract explicit and avoids silently widening repository access just to make the test or rollout pass. If the reusable workflow starts using a new GitHub API capability, the caller permissions must be updated deliberately alongside that change.
