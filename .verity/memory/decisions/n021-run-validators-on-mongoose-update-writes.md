---
schema: 1
id: n021-run-validators-on-mongoose-update-writes
kind: decision
title: "Run validators on Mongoose update writes"
domains: ["mongoose", "validation", "data integrity"]
file_globs: []
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-26T23:39:59.95526+00:00
updated_at: 2026-06-26T23:39:59.866+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Run validators on Mongoose update writes

Use `runValidators: true` on `findOneAndUpdate`/similar update helpers when the write must respect schema constraints. Update operations bypass Mongoose validation by default, so leaving validators off can let invalid values through on the write path even if reads are validated elsewhere. This applies anywhere the code relies on schema rules like `maxlength`, `trim`, or other field constraints to keep persisted data valid.
