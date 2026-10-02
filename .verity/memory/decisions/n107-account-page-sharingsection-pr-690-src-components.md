---
schema: 1
id: n107-account-page-sharingsection-pr-690-src-components
kind: decision
title: "Account-page SharingSection (PR #690, src/components/account/SharingSection.tsx): TanStack Query v5's focusManager listens for 'visibilitychange' and 'focus' on window specifically, not on document —"
domains: []
file_globs: []
confidence: 0.7
status: active
source: agent
created_by: reflect
task: "1bc8e5a0-1d3b-4cee-b416-e312fa0268e7"
created_at: 2026-10-01T01:54:55.929177+00:00
updated_at: 2026-10-01T01:54:55.929177+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Account-page SharingSection (PR #690, src/components/account/SharingSection.tsx): TanStack Query v5's focusManager listens for 'visibilitychange' and 'focus' on window specifically, not on document —

Account-page SharingSection (PR #690, src/components/account/SharingSection.tsx): TanStack Query v5's focusManager listens for 'visibilitychange' and 'focus' on window specifically, not on document — dispatching visibilitychange on document (as first written in src/e2e/helpers/app.ts's waitForContextToReflect) silently never reaches the listener, so a two-browser-context E2E test meant to prove live cross-context refetch-on-focus instead always fell through to a reload fallback. Fix: dispatch both events on window. Also: when a blunt component test mock returns the same object for every useQuery call (as in -account.test.tsx), any new query a component adds must defensively guard against receiving a non-array/wrong-shaped value (toArray() guard in SharingSection.tsx) or it crashes other pre-existing tests in the same file that don't know about the new query.
