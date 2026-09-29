---
schema: 1
id: n069-never-auto-commit-dependency-lockfile-changes-from
kind: decision
title: "Never auto-commit dependency lockfile changes from pull-request CI"
domains: ["ci", "dependency-management", "security"]
file_globs:
  - ".github/workflows/*"
  - "package-lock.json"
confidence: 0.93
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T17:03:02.054549+00:00
updated_at: 2026-08-16T17:03:02.025+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Never auto-commit dependency lockfile changes from pull-request CI

CI jobs that execute code from pull requests must not automatically commit package-lock.json or other dependency-state changes. Such writes undermine reproducible review by allowing generated dependency changes to enter the branch, and they require write-capable credentials in an environment running untrusted code. Lockfile updates must be made through an explicit, separately reviewed change.
