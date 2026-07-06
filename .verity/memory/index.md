# Project Memory Index

*Auto-generated — managed by verity CLI. Do not hand-edit; changes are overwritten.*

> If you are an AI coding agent reading this via CLAUDE.md: scan the catalog below for any node whose title, kind, or file scope is relevant to the task the user just asked you to do. Open the matching files via the Read tool before writing code. Most projects accumulate dozens to hundreds of nodes — do not read them all; pick the few that fit the current change.

## decisions/ (13)

- [[n018-keep-tier-entitlement-checks-centralized-in-shared]] — **Keep tier entitlement checks centralized in shared policy code**
  *decision* · 90% · scope: `**/tier-entitlements/**`
- [[n019-do-not-reveal-note-text-to-unauthorized-tiers]] — **Do not reveal note text to unauthorized tiers**
  *decision* · 88%
- [[n020-verify-recipe-access-before-creating-or-updating-n]] — **Verify recipe access before creating or updating notes**
  *decision* · 85% · scope: `src/server/**/recipe*`
- [[n021-run-validators-on-mongoose-update-writes]] — **Run validators on Mongoose update writes**
  *decision* · 84%
- [[n022-bound-pr-review-waits-with-polling-and-a-timeout]] — **Bound PR review waits with polling and a timeout**
  *decision* · 84% · scope: `.github/workflows/**`
- [[n023-reject-invalid-session-user-ids-before-constructin]] — **Reject invalid session user IDs before constructing ObjectId**
  *decision* · 84% · scope: `src/server/trpc/**`
- [[n024-ignore-generated-review-snapshots-and-local-state]] — **Ignore generated review snapshots and local state in .gitignore**
  *decision* · 77% · scope: `.gitignore`, `**/.gitignore`
- [[n025-coerce-url-query-params-before-numeric-validation]] — **Coerce URL query params before numeric validation**
  *decision* · 84% · scope: `src/**/routes/**`, `src/**/admin/**`
- [[n026-exclude-generated-or-agent-owned-directories-from]] — **Exclude generated or agent-owned directories from Codacy scans**
  *decision* · 78% · scope: `.codacy.yml`
- [[n027-grant-reusable-workflows-only-the-permissions-they]] — **Grant reusable workflows only the permissions they actually need**
  *decision* · 86% · scope: `.github/workflows/*.yml`
- [[n028-use-optimistic-cache-writes-with-rollback-for-note]] — **Use optimistic cache writes with rollback for note saves**
  *decision* · 78% · scope: `src/components/**/PrivateRecipeNotes*`
- [[n029-assert-personal-source-privacy-at-the-network-laye]] — **Assert Personal source privacy at the network layer**
  *decision* · 90%
- [[n030-whitelist-entitlement-tiers-in-route-search-valida]] — **Whitelist entitlement tiers in route search validation**
  *decision* · 78% · scope: `src/routes/**`

## patterns/ (1)

- [[n014-conventions]] — **Conventions**
  *pattern* · 60%

## domain/ (9)

- [[n001-project-overview]] — **Project overview**
  *domain* · 60%
- [[n002-project-purpose]] — **Project purpose**
  *domain* · 50%
- [[n010-project-overview]] — **Project Overview**
  *domain* · 60%
- [[n011-quick-setup]] — **Quick Setup**
  *domain* · 60%
- [[n012-commands]] — **Commands**
  *domain* · 60%
- [[n013-architecture]] — **Architecture**
  *domain* · 60%
- [[n015-development-workflow]] — **Development Workflow**
  *domain* · 60%
- [[n016-completed-additions]] — **Completed additions**
  *domain* · 60%
- [[n017-project-memory]] — **Project Memory**
  *domain* · 60%

## integrations/ (7)

- [[n003-react]] — **react**
  *integration* · 50%
- [[n004-tanstack-start]] — **tanstack-start**
  *integration* · 50%
- [[n005-tanstack-router]] — **tanstack-router**
  *integration* · 50%
- [[n006-mongoose]] — **mongoose**
  *integration* · 50%
- [[n007-better-auth]] — **better-auth**
  *integration* · 50%
- [[n008-trpc]] — **trpc**
  *integration* · 50%
- [[n009-vite]] — **vite**
  *integration* · 50%

