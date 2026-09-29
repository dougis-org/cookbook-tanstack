---
schema: 1
id: n095-when-multiple-worktrees-checkouts-share-one-local
kind: gotcha
title: "When multiple worktrees/checkouts share one local MongoDB instance (mongodb://localhost:27017/cookbook, the Docker default), Better-Auth's JWKS keys are shared too. If a stale JWKS record exists (encr"
domains: []
file_globs:
  - "docker-compose.yml"
confidence: 0.7
status: active
source: agent
created_by: reflect
task: "bc13b37f-c3de-40aa-80e7-8d741f70be68"
created_at: 2026-09-25T22:17:56.342129+00:00
updated_at: 2026-09-25T22:17:56.342129+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# When multiple worktrees/checkouts share one local MongoDB instance (mongodb://localhost:27017/cookbook, the Docker default), Better-Auth's JWKS keys are shared too. If a stale JWKS record exists (encr

When multiple worktrees/checkouts share one local MongoDB instance (mongodb://localhost:27017/cookbook, the Docker default), Better-Auth's JWKS keys are shared too. If a stale JWKS record exists (encrypted with a different BETTER_AUTH_SECRET than the one currently configured, even in a different worktree at a different point in time), every authenticated E2E request fails at runtime with 'Failed to decrypt private key' even though .env.local's BETTER_AUTH_SECRET matches across worktrees and the dev server starts fine — Playwright then reports every single test as failing with ERR_CONNECTION_REFUSED or a hydration timeout, which looks like a systemic app/environment breakage rather than a stale-key issue. Fix: clear the jwks collection directly (db.collection('jwks').deleteMany({})) so Better-Auth regenerates it — safe since it holds no user data, only signing keys. Filed as a workflow gotcha for the share-my-library-foundation E2E run on 2026-09-25; check the jwks collection first the next time an entire E2E suite fails identically across every test.
