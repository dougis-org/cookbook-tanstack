---
schema: 1
id: n036-make-pr-comment-update-steps-non-blocking
kind: decision
title: "Make PR comment/update steps non-blocking"
domains: ["ci", "github-actions", "reporting"]
file_globs:
  - ".github/workflows/*.yml"
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-15T15:44:30.901239+00:00
updated_at: 2026-07-15T15:44:30.808+00:00
related: ["n027-grant-reusable-workflows-only-the-permissions-they"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Make PR comment/update steps non-blocking

Status/comment update steps in CI should use `continue-on-error: true` so notification or reporting failures do not change the job’s main build result. These steps exist to report progress, not to gate correctness, and a transient API or formatting error would otherwise surface as a false build failure. Apply this to workflow steps whose only purpose is PR status/commenting or other post-build reporting.

## Related

**Related:**
- [[n027-grant-reusable-workflows-only-the-permissions-they]]

