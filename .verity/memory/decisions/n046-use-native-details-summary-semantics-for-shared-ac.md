---
schema: 1
id: n046-use-native-details-summary-semantics-for-shared-ac
kind: decision
title: "Use native details/summary semantics for shared accordion UI"
domains: ["accessibility", "design-system", "frontend"]
file_globs: []
confidence: 0.92
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-24T02:09:34.399853+00:00
updated_at: 2026-07-24T02:09:34.376+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use native details/summary semantics for shared accordion UI

The shared Accordion component must be built on native <details>/<summary> semantics rather than a custom ARIA widget. That choice preserves built-in keyboard and disclosure behavior and avoids reimplementing accessibility handling in every consumer. Apply this whenever we add or refactor shared accordion/disclosure primitives, because non-native implementations risk regressions in keyboard navigation and assistive-technology support.
