---
schema: 1
id: n035-use-a-dedicated-paginated-picker-endpoint-for-sour
kind: decision
title: "Use a dedicated paginated picker endpoint for source selection"
domains: ["frontend", "api", "source-selection"]
file_globs: []
confidence: 0.74
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-06T23:59:55.864571+00:00
updated_at: 2026-07-06T23:59:55.771+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use a dedicated paginated picker endpoint for source selection

The source selector needs picker-specific behavior, including pagination and modal handling, without changing the existing source list used elsewhere in the UI. Keeping the picker on a separate endpoint avoids breaking the recipes filter bar and lets source selection evolve independently from the general source list contract. Apply this wherever a selection modal needs a paginated source list that differs from the canonical browsing/listing API.
