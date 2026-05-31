# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/pricing-page-v2` then immediately `git push -u origin feat/pricing-page-v2`

## Execution

### Sub-task 1: State & Toggle Component
- [x] Add parent state `isAnnual` (boolean, defaulting to `true`) inside `PricingPage` in `src/routes/pricing.tsx`.
- [x] Render the Monthly/Annual toggle button at the top of the pricing cards section, complete with the "Save 2 months" active badge.
- [x] Ensure full accessibility attributes are applied.

### Sub-task 2: Dynamic Pricing Math
- [x] Pass `isAnnual` to each `<TierCard>` child.
- [x] For paid cards under `isAnnual = true`, compute monthly equivalent `(annual / 12).toFixed(2)` and render `"Billed annually · $YY/yr"` below it.
- [x] For paid cards under `isAnnual = false`, render `monthly` price directly.
- [x] Keep `FREE` display unchanged for free/anonymous tiers under both toggle states.

### Sub-task 3: Prep Cook "Most Popular" Accentuation
- [x] Identify `prep-cook` tier inside the card mapping.
- [x] Conditionally apply distinctive Tailwind styles: scaling, accent border, shadow, and ring.
- [x] Render the absolute-positioned "Most popular" pill at the top-center edge of the Prep Cook card.
- [x] Render the filled solid-accent CTA button for this card.

### Sub-task 4: Contextual Tier CTAs
- [x] Read active user session tier (`currentTier`).
- [x] On the card matching `currentTier`, render a disabled button labeled `"Current plan"`.
- [x] On other cards, render an active Link button to `/change-tier`.

### Sub-task 5: Reassurance Row
- [x] Create a 3-column responsive grid immediately below the tier cards.
- [x] Implement three columns featuring Lucide icons and headings: "Cancel anytime" (`RefreshCw`), "30-day guarantee" (`ShieldCheck`), and "Export anytime" (`Download`).

### Sub-task 6: FAQ Accordion
- [x] Implement local state `openFaqIndex` defaulting to `0` (first open).
- [x] Map 5 pre-sales FAQ items with smooth toggle expand/collapse behavior.

---

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b feat/pricing-page-v2` → `git push -u origin feat/pricing-page-v2`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit/integration tests: `rtk npm test -- src/routes/__tests__/-pricing.test.tsx`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build validation: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #453".**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: Antigravity AI
- Reviewer(s): @dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/pricing-page-v2/` to `openspec/changes/archive/2026-05-31-pricing-page-v2/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-05-31-pricing-page-v2/` exists and `openspec/changes/pricing-page-v2/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-05-31-pricing-page-v2` then `git push -u origin doc/archive-2026-05-31-pricing-page-v2`
- [ ] Open a PR from `doc/archive-2026-05-31-pricing-page-v2` to `main` with title `docs: archive pricing-page-v2 (2026-05-31)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/pricing-page-v2 doc/archive-2026-05-31-pricing-page-v2`

Required cleanup after archive: `git fetch --prune` and `git branch -d feat/pricing-page-v2 doc/archive-2026-05-31-pricing-page-v2`
