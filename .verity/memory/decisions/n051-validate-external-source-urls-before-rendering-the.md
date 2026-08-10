---
schema: 1
id: n051-validate-external-source-urls-before-rendering-the
kind: decision
title: "Validate external source URLs before rendering them as links"
domains: ["security", "frontend", "url-handling"]
file_globs:
  - "src/**/*source*"
  - "src/**/*print*"
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-08-08T02:03:02.021423+00:00
updated_at: 2026-08-08T02:03:02.003+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Validate external source URLs before rendering them as links

Only render `sourceUrl` as a clickable external link after passing a safety check, so obviously dangerous non-http(s) or malformed schemes cannot become navigable UI. This is a security constraint, not just input cleanup: any route that turns stored URLs into anchors must reject unsafe schemes first, or users could be exposed to scriptable or deceptive links.
