# Project Memory Index

*Auto-generated — managed by verity CLI. Do not hand-edit; changes are overwritten.*

> If you are an AI coding agent reading this via CLAUDE.md: scan the catalog below for any node whose title, kind, or file scope is relevant to the task the user just asked you to do. Open the matching files via the Read tool before writing code. Most projects accumulate dozens to hundreds of nodes — do not read them all; pick the few that fit the current change.

## decisions/ (76)

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
- [[n065-warm-production-and-authentication-endpoints-befor]] — **Warm production and authentication endpoints before production-mode E2E tests**
  *decision* · 84%
- [[n066-generate-better-auth-secrets-at-ci-job-runtime]] — **Generate Better Auth secrets at CI job runtime**
  *decision* · 90% · scope: `.github/workflows/*test*.yml`
- [[n067-warm-all-lazy-loaded-ssr-paths-before-production-s]] — **Warm all lazy-loaded SSR paths before production-server E2E tests**
  *decision* · 84% · scope: `.github/workflows/**`
- [[n068-use-one-bounded-bot-managed-pr-status-comment]] — **Use one bounded bot-managed PR status comment**
  *decision* · 82% · scope: `.github/workflows/**`
- [[n069-never-auto-commit-dependency-lockfile-changes-from]] — **Never auto-commit dependency lockfile changes from pull-request CI**
  *decision* · 93% · scope: `.github/workflows/*`, `package-lock.json`
- [[n070-preserve-legacy-account-routes-as-redirects-during]] — **Preserve legacy account routes as redirects during UX consolidation**
  *decision* · 82% · scope: `**/account/**`
- [[n071-allowlist-and-safely-escape-theme-ids-in-bootstrap]] — **Allowlist and safely escape theme IDs in bootstrap scripts**
  *decision* · 91%
- [[n072-require-both-shell-visibility-and-router-idle-befo]] — **Require both shell visibility and router idle before treating pages as hydrated**
  *decision* · 86% · scope: `**/e2e/**`
- [[n073-warm-both-the-application-root-and-auth-session-en]] — **Warm both the application root and auth session endpoint before E2E tests**
  *decision* · 82% · scope: `.github/workflows/**`
- [[n074-preserve-legacy-account-routes-as-authenticated-re]] — **Preserve legacy account routes as authenticated redirects**
  *decision* · 88% · scope: `src/routes/**/account*.tsx`
- [[n075-scope-public-recipe-ad-eligibility-with-explicit-p]] — **Scope public recipe ad eligibility with explicit PageLayout roles**
  *decision* · 89%
- [[n076-reject-external-avatar-urls-unless-an-image-provid]] — **Reject external avatar URLs unless an image provider is explicitly allowlisted**
  *decision* · 91% · scope: `**/account/**`
- [[n077-validate-session-objectids-before-constructing-aut]] — **Validate session ObjectIds before constructing authorization filters**
  *decision* · 86% · scope: `**/account/**`
- [[n078-use-the-shared-better-auth-collection-helper-for-u]] — **Use the shared Better Auth collection helper for user data access**
  *decision* · 88%
- [[n079-normalize-user-search-input-and-enforce-a-2-254-ch]] — **Normalize user search input and enforce a 2–254 character bound**
  *decision* · 82% · scope: `**/routers/users.ts`
- [[n080-bound-and-trim-users-router-search-input-before-qu]] — **Bound and trim users-router search input before querying**
  *decision* · 86%
- [[n081-escape-user-search-text-before-constructing-mongod]] — **Escape user search text before constructing MongoDB regex filters**
  *decision* · 93%
- [[n082-bound-and-normalize-user-search-input-before-query]] — **Bound and normalize user-search input before querying**
  *decision* · 86%
- [[n083-trim-and-bound-users-router-search-input-before-ex]] — **Trim and bound users-router search input before executing queries**
  *decision* · 82%
- [[n084-bound-and-normalize-user-search-input-before-datab]] — **Bound and normalize user-search input before database access**
  *decision* · 86%
- [[n085-enforce-bounded-trimmed-input-before-user-search-q]] — **Enforce bounded, trimmed input before user-search query construction**
  *decision* · 86% · scope: `src/**/routers/users*`
- [[n086-require-verified-executive-chef-authorization-for]] — **Require verified executive-chef authorization for authenticated user search**
  *decision* · 87%
- [[n087-model-account-wide-sharing-as-unique-owner-to-reci]] — **Model account-wide sharing as unique owner-to-recipient grants**
  *decision* · 90% · scope: `**/*library*share*`, `**/models/*share*`
- [[n088-represent-shared-cookbook-content-as-live-owner-re]] — **Represent shared cookbook content as live owner references**
  *decision* · 92%
- [[n089-resolve-shared-owner-access-in-request-context-and]] — **Resolve shared-owner access in request context and fail closed on tier lookup errors**
  *decision* · 88%
- [[n090-retain-sharing-grants-and-evaluate-tier-eligibilit]] — **Retain sharing grants and evaluate tier eligibility at read time**
  *decision* · 86%
- [[n091-retain-sharing-grants-across-owner-tier-changes]] — **Retain sharing grants across owner tier changes**
  *decision* · 88% · scope: `**/share-my-library/**`
- [[n092-exclude-pending-verification-content-from-shared-o]] — **Exclude pending-verification content from shared-owner visibility results**
  *decision* · 88%
- [[n093-use-the-database-singleton-as-the-sole-mongodb-con]] — **Use the database singleton as the sole MongoDB connection entry point**
  *decision* · 73% · scope: `**/db/**`
- [[n096-allow-list-fields-returned-by-sharing-list-endpoin]] — **Allow-list fields returned by sharing-list endpoints**
  *decision* · 72%
- [[n097-keep-collaborator-lookup-outages-retryable-without]] — **Keep collaborator lookup outages retryable without broadening shared access**
  *decision* · 75%
- [[n098-keep-alexa-integration-adapters-read-only]] — **Keep Alexa integration adapters read-only**
  *decision* · 77% · scope: `**/alexa/**`
- [[n099-fail-visibly-when-collaborator-cookbook-lookup-fai]] — **Fail visibly when collaborator cookbook lookup fails**
  *decision* · 72% · scope: `**/trpc/**`
- [[n100-fail-closed-when-resolving-shared-cookbook-access]] — **Fail closed when resolving shared cookbook access**
  *decision* · 76%
- [[n101-project-only-public-fields-from-joined-users-in-sh]] — **Project only public fields from joined users in sharing listings**
  *decision* · 79%
- [[n102-keep-personal-and-eligibility-data-out-of-sharing]] — **Keep personal and eligibility data out of sharing-grant results**
  *decision* · 79% · scope: `**/library-sharing/**`
- [[n103-resolve-shared-cookbook-entries-through-caller-vis]] — **Resolve shared cookbook entries through caller visibility at read time**
  *decision* · 83%
- [[n104-resolve-shared-cookbook-recipes-at-read-time]] — **Resolve shared cookbook recipes at read time**
  *decision* · 79%
- [[n105-keep-cross-owner-cookbook-entries-as-read-time-ref]] — **Keep cross-owner cookbook entries as read-time references**
  *decision* · 82%
- [[n106-derive-mutation-coverage-from-registered-router-pr]] — **Derive mutation coverage from registered router procedures**
  *decision* · 78%
- [[n107-account-page-sharingsection-pr-690-src-components]] — **Account-page SharingSection (PR #690, src/components/account/SharingSection.tsx): TanStack Query v5's focusManager listens for 'visibilitychange' and 'focus' on window specifically, not on document —**
  *decision* · 70%

## gotchas/ (2)

- [[n094-the-design-md-prescribed-exists-then-aggregate-gua]] — **The design.md-prescribed exists()-then-aggregate() guard pattern for cheap query-count optimizations is a trap: an existence-check guard before a conditional query never actually reduces total round-t**
  *gotcha* · 70% · scope: `src/server/trpc/context.ts`, `openspec/changes/archive/2026-09-25-share-my-library-foundation/design.md`, `openspec/changes/archive/2026-09-25-share-my-library-foundation/specs/library-sharing-foundation/spec.md`
- [[n095-when-multiple-worktrees-checkouts-share-one-local]] — **When multiple worktrees/checkouts share one local MongoDB instance (mongodb://localhost:27017/cookbook, the Docker default), Better-Auth's JWKS keys are shared too. If a stale JWKS record exists (encr**
  *gotcha* · 70% · scope: `docker-compose.yml`

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

