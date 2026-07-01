---
schema: 1
id: n026-exclude-generated-or-agent-owned-directories-from
kind: decision
title: "Exclude generated or agent-owned directories from Codacy scans"
domains: ["code-quality", "ci", "tooling"]
file_globs:
  - ".codacy.yml"
confidence: 0.78
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-30T22:31:48.687132+00:00
updated_at: 2026-06-30T22:31:48.581+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Exclude generated or agent-owned directories from Codacy scans

Codacy scans must not include generated outputs or agent/tooling-owned directories, because those files are not hand-authored source and will otherwise create noisy or misleading quality/security findings. Apply this when configuring repository analysis so only maintained application code is evaluated; if new generated or automation-managed paths are added, they should be kept out of the scan set for the same reason.
