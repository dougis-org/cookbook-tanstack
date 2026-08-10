# Project Memory Index

*Auto-generated — managed by verity CLI. Do not hand-edit; changes are overwritten.*

> If you are an AI coding agent reading this via CLAUDE.md: scan the catalog below for any node whose title, kind, or file scope is relevant to the task the user just asked you to do. Open the matching files via the Read tool before writing code. Most projects accumulate dozens to hundreds of nodes — do not read them all; pick the few that fit the current change.

## decisions/ (35)

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
- [[n032-pin-codacy-tool-runtime-versions-in-codacy-codacy]] — **Pin Codacy tool/runtime versions in .codacy/codacy.yaml**
  *decision* · 80% · scope: `.codacy/codacy.yaml`
- [[n033-sync-approved-spec-deltas-into-the-canonical-spec]] — **Sync approved spec deltas into the canonical spec after merge**
  *decision* · 77% · scope: `openspec/specs/**/spec.md`, `openspec/changes/**/spec.md`
- [[n034-filter-sources-on-the-server-and-page-initial-sour]] — **Filter sources on the server and page initial source loads**
  *decision* · 91%
- [[n036-make-pr-comment-update-steps-non-blocking]] — **Make PR comment/update steps non-blocking**
  *decision* · 84% · scope: `.github/workflows/*.yml`
- [[n037-use-a-printfooter-slot-on-recipedetail-for-cookboo]] — **Use a printFooter slot on RecipeDetail for cookbook-only trailing content**
  *decision* · 83%
- [[n038-keep-recipedetail-presentational-resolve-personal]] — **Keep RecipeDetail presentational; resolve personal notes in the route**
  *decision* · 84% · scope: `src/routes/recipes/**`
- [[n039-reuse-the-same-trpc-query-options-to-keep-the-priv]] — **Reuse the same TRPC query options to keep the private-note cache key stable**
  *decision* · 80%
- [[n040-seed-theme-state-in-playwright-before-navigation-f]] — **Seed theme state in Playwright before navigation for pre-hydration cases**
  *decision* · 88%
- [[n041-keep-hydration-and-styling-dependent-theme-checks]] — **Keep hydration- and styling-dependent theme checks in E2E tests**
  *decision* · 84%
- [[n042-keep-better-auth-configuration-centralized-and-sha]] — **Keep Better Auth configuration centralized and shape-tested**
  *decision* · 87% · scope: `src/lib/auth.ts`, `**/*better-auth*`
- [[n043-keep-oauth-single-client-until-there-is-a-real-sec]] — **Keep OAuth single-client until there is a real second consumer**
  *decision* · 82%
- [[n044-reconcile-theme-context-with-server-session-after]] — **Reconcile theme context with server session after hydration**
  *decision* · 88% · scope: `src/**/ThemeContext.*`
- [[n045-pass-vite-production-env-values-at-build-time-thro]] — **Pass Vite production env values at build time through Fly build args and Docker ARG/ENV**
  *decision* · 93% · scope: `fly.toml`, `Dockerfile`
- [[n046-use-native-details-summary-semantics-for-shared-ac]] — **Use native details/summary semantics for shared accordion UI**
  *decision* · 92%
- [[n047-require-skill-identity-checks-in-alexa-request-val]] — **Require skill identity checks in Alexa request validation**
  *decision* · 93%
- [[n048-scope-third-party-sharing-to-connected-oauth-clien]] — **Scope third-party sharing to connected OAuth clients in the privacy policy**
  *decision* · 86% · scope: `**/privacy-policy.*`
- [[n049-check-cookbook-ownership-before-returning-cookbook]] — **Check cookbook ownership before returning cookbook details**
  *decision* · 79% · scope: `src/**/cookbook*/**`, `src/**/cookbooks/**`
- [[n050-use-optimistic-note-save-cache-updates-with-rollba]] — **Use optimistic note-save cache updates with rollback on failure**
  *decision* · 78%
- [[n051-validate-external-source-urls-before-rendering-the]] — **Validate external source URLs before rendering them as links**
  *decision* · 84% · scope: `src/**/*source*`, `src/**/*print*`
- [[n052-persist-alexa-conversation-state-by-alexa-user-id]] — **Persist Alexa conversation state by Alexa user ID**
  *decision* · 90%
- [[n053-wait-for-hydration-via-an-explicit-dom-readiness-m]] — **Wait for hydration via an explicit DOM readiness marker, not networkidle or sleeps**
  *decision* · 86%
- [[n054-only-inject-analytics-ids-from-validated-productio]] — **Only inject analytics IDs from validated production env values**
  *decision* · 86%

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

