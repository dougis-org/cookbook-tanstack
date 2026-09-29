---
schema: 1
id: n094-the-design-md-prescribed-exists-then-aggregate-gua
kind: gotcha
title: "The design.md-prescribed exists()-then-aggregate() guard pattern for cheap query-count optimizations is a trap: an existence-check guard before a conditional query never actually reduces total round-t"
domains: []
file_globs:
  - "src/server/trpc/context.ts"
  - "openspec/changes/archive/2026-09-25-share-my-library-foundation/design.md"
  - "openspec/changes/archive/2026-09-25-share-my-library-foundation/specs/library-sharing-foundation/spec.md"
confidence: 0.7
status: active
source: agent
created_by: reflect
task: "bc13b37f-c3de-40aa-80e7-8d741f70be68"
created_at: 2026-09-25T22:17:39.346146+00:00
updated_at: 2026-09-25T22:17:39.346146+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# The design.md-prescribed exists()-then-aggregate() guard pattern for cheap query-count optimizations is a trap: an existence-check guard before a conditional query never actually reduces total round-t

The design.md-prescribed exists()-then-aggregate() guard pattern for cheap query-count optimizations is a trap: an existence-check guard before a conditional query never actually reduces total round-trips if the guarded query's own first pipeline stage (an indexed $match) already returns empty in one round trip when there's nothing to find. In src/server/trpc/context.ts's ctx.sharedOwnerIds resolution, the exists()-then-aggregate() guard cost 2 queries when the caller had grants and only tied (not beat) the aggregate-only approach when the caller had none — so it was strictly dominated and was removed, running the aggregation unconditionally instead. Before adding an existence/count guard ahead of an aggregation, check whether the aggregation's own leading $match on an indexed field already makes the zero-match case cheap; if so, the guard is dead weight. Also: openspec/changes/share-my-library-foundation's own proposal.md, design.md, and specs/library-sharing-foundation/spec.md were internally self-contradictory about this query-count NFAC (one said 'zero round trips when no grants', another prescribed the exists() guard mechanism that can't achieve that) — worth reviewing new OpenSpec docs' NFAC language for this class of contradiction before implementation starts, not after.
