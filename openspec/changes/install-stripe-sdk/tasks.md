# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/install-stripe-sdk` then immediately `git push -u origin feat/install-stripe-sdk`

## Execution

### Task 1: Install Stripe package and create singleton

- [x] Run `npm install stripe@22.1.0`
- [x] Create `src/lib/stripe.ts` with:
  - Import `Stripe` from `stripe`
  - Lazy-initialized singleton `_stripe` (undefined by default)
  - Export `getStripe()` function that:
    - Returns existing instance if already created
    - Reads `STRIPE_SECRET_KEY` from env (or throws clear error if missing)
    - Creates new instance with `apiVersion: "2026-04-22.dahlia"`
    - Caches and returns instance
  - Error message: `"STRIPE_SECRET_KEY env var not set."`
- [x] Verify: `npx tsc --noEmit` (TypeScript strict checks pass)

### Task 2: Fix GitHub issue #422 naming error

- [x] Use `gh issue edit 422` to replace `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` with `VITE_STRIPE_PUBLISHABLE_KEY` in the issue body
- [x] Verify: `gh issue view 422 --json body -q .body | grep VITE_STRIPE_PUBLISHABLE_KEY` (confirms change)

### Task 3: Update `.env.example` with all Stripe environment variables

- [x] Append Stripe section after ImageKit block in `.env.example`:
  ```
  # Stripe billing
  # Get keys from: https://dashboard.stripe.com/test/apikeys
  STRIPE_SECRET_KEY=              # Server-side only — never expose to client
  VITE_STRIPE_PUBLISHABLE_KEY=    # Safe for client (Stripe.js)
  STRIPE_WEBHOOK_SECRET=          # Stripe CLI: stripe listen --print-secret

  # Stripe price IDs (from Stripe dashboard → Products)
  STRIPE_PRICE_PREP_COOK_MONTHLY=
  STRIPE_PRICE_PREP_COOK_ANNUAL=
  STRIPE_PRICE_SOUS_CHEF_MONTHLY=
  STRIPE_PRICE_SOUS_CHEF_ANNUAL=
  STRIPE_PRICE_EXEC_CHEF_MONTHLY=
  STRIPE_PRICE_EXEC_CHEF_ANNUAL=
  ```
- [x] Verify: `grep -A 12 "# Stripe billing" .env.example` (all 9 vars present with comments)

### Task 4: Update README.md with Stripe sandbox setup instructions

- [x] Find "Environment Configuration" section in README.md
- [x] After the ImageKit section, insert Stripe sandbox setup subsection:
  ```
  ### Stripe Setup (Billing)

  Stripe billing is integrated at the subscription tier level. To configure locally:

  1. Create a Stripe account at https://stripe.com and use Test mode keys
  2. Add your test `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY` to `.env.local`
  3. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```
     Copy the printed webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`
  4. Create price objects in your Stripe dashboard and add their IDs to `.env.local` (see `.env.example` for all six tier price IDs)

  `STRIPE_SECRET_KEY` is server-side only and must never be exposed to the client.
  ```
- [x] Verify: `grep -A 8 "### Stripe Setup" README.md` (section present with all steps)

## Validation

- [x] **Type check:** `npx tsc --noEmit` (no TypeScript errors)
- [x] **Build:** `npm run build` (production build succeeds with zero Stripe SDK code in `.output/public`)
- [x] **Verify no client leakage:**
  ```bash
  grep -r "stripe" .output/public --include="*.js" 2>/dev/null | grep -v "\.stripe\." || echo "✓ No Stripe SDK in client bundle"
  ```
- [x] **Manual smoke test:**
  - Import `getStripe` in a server file (e.g., `src/server/test.ts`)
  - Call `getStripe()` without `STRIPE_SECRET_KEY` set
  - Verify error message is `"STRIPE_SECRET_KEY env var not set."`
- [x] **All completed tasks marked as complete** (`- [x]`)

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` (all tests pass)
- **Build** — `npm run build` (build succeeds with no errors)
- **Type check** — `npx tsc --noEmit` (no TypeScript errors)

If **ANY** of the above fail, iterate and address the failure before proceeding.

## PR and Merge

- [ ] Run the required pre-PR self-review before committing
- [ ] Commit all changes: `git add -A && git commit -m "feat: install and configure Stripe SDK (#422)"`
- [ ] Push to remote: `git push origin feat/install-stripe-sdk`
- [ ] Open PR: `gh pr create --base main --head feat/install-stripe-sdk --title "Install and configure Stripe SDK (#422)" --body "$(cat openspec/changes/install-stripe-sdk/proposal.md)"`
- [ ] Wait 180 seconds for CI to start
- [ ] Enable auto-merge: `gh pr merge --auto --merge <PR-URL>`
- [ ] **Monitor PR comments** — autonomously poll for new comments; address any, commit fixes, push, wait 180 seconds, repeat until resolved
- [ ] **Monitor CI checks** — autonomously poll for check status; if any fail, diagnose, fix, commit, push, wait 180 seconds, repeat until all pass
- [ ] **Poll for merge** — run `gh pr view <PR-URL> --json state` after each iteration; when `state` is `MERGED` proceed to Post-Merge

Ownership metadata:

- Implementer: Claude Code
- Reviewer(s): Project maintainers (code review via GitHub)
- Required approvals: GitHub CI checks (build, type-check, tests)

Blocking resolution flow:

- **CI failure** → diagnose → fix → commit → validate locally → push → re-run checks
- **Security finding** → remediate → commit → validate locally → push → re-scan
- **Review comment** → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main: `git log --oneline -5` (confirm latest commit is Stripe SDK merge)
- [ ] Mark all remaining tasks as complete
- [ ] Update repository documentation (README and `.env.example` are already updated)
- [ ] Sync approved spec deltas into `openspec/specs/stripe-sdk.md` (if spec reusable across projects)
- [ ] Archive the change:
  ```bash
  mkdir -p openspec/changes/archive/2026-05-05-install-stripe-sdk
  cp -r openspec/changes/install-stripe-sdk/* openspec/changes/archive/2026-05-05-install-stripe-sdk/
  rm -rf openspec/changes/install-stripe-sdk
  git add openspec/changes/archive/2026-05-05-install-stripe-sdk/ openspec/changes/install-stripe-sdk
  git commit -m "archive: move install-stripe-sdk to archive"
  git push origin main
  ```
- [ ] Verify archive exists: `ls openspec/changes/archive/2026-05-05-install-stripe-sdk/` (confirms move)
- [ ] Clean up: `git fetch --prune` and `git branch -d feat/install-stripe-sdk`

Required cleanup: `git fetch --prune` and `git branch -d feat/install-stripe-sdk`
