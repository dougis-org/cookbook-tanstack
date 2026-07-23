# CI/CD Workflow Standards

## CI/CD is Authoritative

**CI/CD validation is the source of truth for merge readiness.** All checks run on CI/CD are binding, and results override local analysis.

### Why CI/CD is Authoritative

- Runs on clean environment (eliminates local "works on my machine")
- Uses consistent tool versions across all PRs  
- Maintains audit trail of all checks
- Enforces non-repudiation (changes recorded in history)
- Can be reproduced by any contributor

## Local vs CI Validation

### Local Analysis
- **Scope:** Supplementary feedback during development
- **Timing:** Optional, ad-hoc runs during work
- **Authority:** Informational only
- **Use it for:** Fast feedback loop, catch obvious issues early
- **Don't rely on it:** Final gate before merge

### CI/CD Validation
- **Scope:** Complete, authoritative checks on all PRs
- **Timing:** Automatic on every PR
- **Authority:** Binding, determines merge readiness
- **Use it for:** Final validation before merge
- **Guarantees:** Reproducible, auditable, consistent

## Before Creating a Pull Request

These must all pass locally or be acceptable to fix in PR:

- ✅ Code compiles/runs without errors (`npm run build`, `npm run dev`)
- ✅ Tests pass (`npm run test`, `npm run test:e2e`)
- ✅ TypeScript strict mode (`npx tsc --noEmit`)
- ⚠️ Optional: Run optional tools locally for feedback

## Pull Request Requirements

A PR is ready to merge when:

1. **All automated checks pass** on CI/CD (required)
   - Test suite passes (unit + E2E)
   - TypeScript compilation succeeds
   - Security scans clean (no blocker vulnerabilities)
   - Code quality checks pass (no critical issues)
   - Linting passes (or marked as acceptable)

2. **Code review approved** (required)
   - Minimum 1 approval for normal PRs
   - Senior review for architectural changes

3. **All PR comments addressed** (required)
   - All review comments resolved or dismissed
   - Any requested changes implemented

4. **Merge conflicts resolved** (required if applicable)

5. **Commits squashed or clean** (project preference)

## Auto-Merge Workflow

**All PRs should be marked for auto-merge** after creation. This enables automatic merging once all requirements are met:

### How to Enable Auto-Merge

When creating a PR:
1. Create the PR as normal with clear description and context
2. Enable auto-merge on the PR (preferably via GitHub MCP tools, or GitHub UI/API as fallback)
3. Select merge method: "squash and merge"

### Auto-Merge Conditions

The PR will automatically merge when:
- ✅ All CI/CD checks pass
- ✅ Required approvals obtained
- ✅ All review comments addressed/resolved
- ✅ No merge conflicts
- ✅ Branch is up to date with base branch (if required)

### Benefits of Auto-Merge

- **Reduces manual intervention:** No need to manually click merge after approvals
- **Ensures quality:** Only merges when all gates pass
- **Faster feedback loop:** Changes land as soon as they're ready
- **Prevents forgotten PRs:** Automatically completes work once validated

### After Auto-Merge Completion

Once the PR auto-merges:
- Branch is automatically deleted (if configured)
- Related issue updated/closed (if linked)
- Deployment pipeline may trigger automatically
- Contributors notified of merge

## What CI/CD Checks

Standard CI/CD pipeline (Build and Test workflow) runs:

- **Build:** Vite build succeeds, assets generated
- **TypeScript:** Type checking with strict mode
- **Tests:** Unit tests (Vitest) + Integration tests + E2E tests (Playwright)
- **Coverage:** Test coverage consolidated and reported to Codacy
- **Security:** Dependency scanning (Snyk) + container scanning (Trivy)
- **Code Quality:** Issue detection (Codacy) + linting

## What CI/CD Does NOT Check

Do not rely on CI/CD for:

- **Code metrics (optional):** Duplication, complexity, coverage percentages
  - Metrics are informational, not gate conditions
  - Focus on fixing issues, not optimizing metrics
- **Style preferences:** Beyond what linters enforce
- **Architecture decisions:** Beyond what schema/types enforce

## Handling CI/CD Failures

### PR Fails CI/CD

1. Review failure reason
2. Check which check failed (test, security, quality, build)
3. If local, fix locally and push
4. If environment-specific, may require CI/CD environment investigation
5. Contact maintainers if unable to resolve

### Flaky/Intermittent Failures

- If test is flaky: Fix test to be deterministic
- If tool fails intermittently: Run again, file issue if persistent
- If environment is unstable: Raise with maintainers

## Production Secrets & Environment Variables

Every value the production deployment depends on, where it's configured, and
why. See `.env.example` for local dev setup. This inventory is derived from
`.env.example`, `fly.toml`, `.github/workflows/deploy.yml`, and
`.github/workflows/build-and-test.yml` as of the last audit — cross-check
against `fly secrets list` and the repo's Settings → Secrets and variables
page if you suspect drift.

**Storage locations — semantics differ:**

- **Fly secret** — injected at container *runtime* only, via `fly secrets
  set`. Never visible during a build. Use for anything server-side.
- **Fly `[env]`** — plaintext block in `fly.toml`, versioned in git. Runtime
  only, non-sensitive values only.
- **GitHub Actions secret** — masked, available only inside workflow runs.
- **GitHub Actions Variable** — unmasked, available inside workflow runs.
  Used (not Secrets) for `VITE_*` values because they must be passed as
  `--build-arg` during the Docker build, which happens in the GitHub Actions
  runner *before* the container exists — Fly secrets aren't reachable yet at
  that point in the pipeline.

| Variable | Where it's set | What depends on it | Changes when |
|---|---|---|---|
| `APP_PRIMARY_URL` | Fly secret | `getDomainRedirectUrl` (`src/lib/domain-redirect.ts`, wired in `src/start.ts`) — 301-redirects non-primary hosts here; `src/emails/Layout.tsx` email link base URL; `src/server/trpc/routers/cookbooks.ts` share-link base URL | Domain migration |
| `BETTER_AUTH_URL` | Fly secret | Better-Auth session/cookie issuance base URL | Domain migration |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Fly secret | Better-Auth CORS/origin allowlist | Domain migration — must include the outgoing domain and the `.fly.dev` fallback alongside the new primary during a transition period |
| `BETTER_AUTH_SECRET` | Fly secret | Session token signing | Credential rotation only |
| `MONGODB_URI` | Fly secret | All database access | New environment, Atlas credential rotation, cluster migration |
| `MAILTRAP_API_TOKEN` | Fly secret | Outgoing email (verification, notifications) | Mailtrap credential rotation |
| `MAIL_FROM` | Fly secret | From-address on outgoing email | Sending domain change |
| `IMAGE_KIT_API_KEY` (alt. name: `IMAGEKIT_PRIVATE_KEY`) | Fly secret | Recipe image upload/delete — `src/lib/imagekit.ts` reads `IMAGE_KIT_API_KEY ?? IMAGEKIT_PRIVATE_KEY`, so either name works | ImageKit credential rotation |
| `STRIPE_SECRET_KEY` | Fly secret | Server-side Stripe API calls (`src/lib/stripe.ts`) | Stripe key rotation, test→live switch |
| `STRIPE_WEBHOOK_SECRET` | Fly secret (reserved, not yet consumed) | Declared in `.env.example` for future webhook signature verification — no code under `src/` reads this var yet; webhook handling isn't implemented | N/A until webhook handling ships |
| `STRIPE_PRICE_*` (6 vars: `PREP_COOK`/`SOUS_CHEF`/`EXEC_CHEF` × `MONTHLY`/`ANNUAL`) | Fly secret (reserved, not yet consumed) | Declared in `.env.example` for future checkout price lookup — no code under `src/` reads these vars yet; checkout/subscription logic isn't implemented | N/A until checkout flow ships |
| `VITE_STRIPE_PUBLISHABLE_KEY` | **Intended:** GitHub Actions Variable, passed via `--build-arg` (same pattern as the `VITE_GOOGLE_*` vars below) — **not yet wired into `deploy.yml`**. See [#635](https://github.com/dougis-org/cookbook-tanstack/issues/635); Stripe billing isn't fully set up yet so this is expected to remain open for a while | Stripe.js client-side init | Stripe key rotation, and separately whenever #635 is resolved |
| `VITE_GOOGLE_ANALYTICS_ID` | GitHub Actions Variable | GA4 tracking | Analytics property change |
| `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID` / `_BOTTOM_SLOT_ID` / `_RIGHT_RAIL_SLOT_ID` | GitHub Actions Variable | AdSense unit rendering | Ad unit changes |
| `VITE_ADSENSE_ENABLED` | GitHub Actions Variable | Toggles live AdSense vs. the static upgrade card | AdSense account approval status |
| `FLY_API_TOKEN` | GitHub Actions secret | `deploy.yml` — authenticates `flyctl deploy` | Fly token rotation |
| `CODACY_API_TOKEN` | GitHub Actions secret | `build-and-test.yml` — coverage/quality upload | Codacy token rotation |
| `PORT` | Fly `[env]` (`fly.toml`) | Server listen port | Rarely — infra change |
| `NODE_ENV` | Fly `[env]` (`fly.toml`) | Production-mode flags across the app | Rarely |

### What Breaks If Wrong

Coverage below is selective, not exhaustive — vars like `PORT`, `NODE_ENV`,
and the `VITE_GOOGLE_*` analytics/ads vars fail immediately and loudly (a
container that won't bind its port, a tracking script that just doesn't
fire), so there's no ambiguity worth writing up. The vars below are the ones
where "wrong" produces something worse than an obvious, loud failure.

**`APP_PRIMARY_URL`**
Wrong or missing → `getDomainRedirectUrl` either redirects to a dead/wrong
host (locking out traffic hitting the real domain) or silently disables the
redirect middleware entirely (stale domains stay reachable instead of
canonicalizing). Also corrupts email links (`Layout.tsx`) and cookbook
share links (`cookbooks.ts`), both of which fall back to `BETTER_AUTH_URL`
or a hardcoded `mycookbooks.app` — a wrong value here can silently send
users recipe/cookbook links that 404 or point at an inactive domain.

**`BETTER_AUTH_URL`**
Wrong value → every session cookie is issued against the wrong origin.
Users get logged out or can't log in at all. This is the highest-blast-radius
single var in the table — get it wrong and all authenticated traffic breaks
simultaneously.

**`BETTER_AUTH_TRUSTED_ORIGINS`**
Missing an active domain here → Better-Auth rejects requests from that
origin as CORS/CSRF violations, even though `APP_PRIMARY_URL` and DNS are
correct. Easy to forget during a domain migration, because the app *looks*
fine on the new domain right up until someone hits it from the old one
(bookmarks, old links, the `.fly.dev` health check). During a migration,
keep the outgoing domain listed until traffic has fully moved.

**`BETTER_AUTH_SECRET`**
Rotating this invalidates every active session instantly — every logged-in
user is force-logged-out. Treat as a "requires a maintenance
window/communication" rotation, never a silent hot-swap.

**`MONGODB_URI`**
Wrong value → the app fails to boot (`src/db/index.ts` throws on connect)
or, worse, silently connects to the *wrong* database if the URI is valid
but points at a different cluster/db name — reads and writes go to the
wrong place with no error. Verify the db name in the URI, not just
reachability, when rotating.

**`STRIPE_SECRET_KEY`**
Wrong value → any code path that calls `getStripe()` (`src/lib/stripe.ts`)
fails loudly at the point of use. This is the only Stripe var actually
consumed by application code today.

**`STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_*` (not yet implemented)**
These are declared in `.env.example` and provisioned as Fly secrets ahead
of need, but no code under `src/` reads them yet — webhook handling and
the checkout/subscription flow haven't shipped. Once they do: expect wrong
`STRIPE_WEBHOOK_SECRET` to fail webhook signature verification silently
from Stripe's perspective (Stripe's dashboard reports its own 200s as
usual while the app rejects every event, so subscription state would
silently stop syncing — the quietest failure mode in this table), and
wrong `STRIPE_PRICE_*` to make checkout succeed while charging/provisioning
the wrong tier. Revisit this entry once that code lands so it describes
actual behavior instead of anticipated behavior.

**`VITE_STRIPE_PUBLISHABLE_KEY`**
Intended location is a GitHub Actions Variable passed via `--build-arg`
(same as the AdSense/GA vars) — but `deploy.yml` doesn't currently validate
or pass it, per [#635](https://github.com/dougis-org/cookbook-tanstack/issues/635).
Until that's resolved, treat this var's production behavior as unconfirmed:
if it's missing from the client bundle, Stripe.js fails to initialize and
checkout is unusable app-wide, and the failure is invisible in local dev
(Vite reads `.env.local` directly there, so this class of bug only shows up
in a real production build).

**`MAILTRAP_API_TOKEN` / `MAIL_FROM`**
Wrong token → outgoing email (verification, notifications) fails. Depending
on how the mail client handles errors, this can silently swallow send
failures — new signups may complete but never receive a verification email,
with no obvious signal in app logs unless mail-send failures are explicitly
logged.

**`IMAGE_KIT_API_KEY`**
Wrong value → recipe image upload/delete calls fail. Existing images
already served via ImageKit URLs keep working (this key isn't in the read
path), so the failure is scoped to new uploads/deletes — easy to miss in a
smoke test that only checks existing pages render.

**`FLY_API_TOKEN` / `CODACY_API_TOKEN`**
Wrong or expired → the relevant CI job fails loudly (deploy blocked, or the
Codacy upload step fails). Lowest-risk category in this table — failures
here can't reach production silently.

### Domain strings not driven by `APP_PRIMARY_URL`

`mycookbooks.app` (hardcoded fallback in `src/emails/Layout.tsx`) and
`mycookbooks.com` (hardcoded contact email in `src/routes/privacy-policy.tsx`)
are **not** derived from `APP_PRIMARY_URL`. Rotating `APP_PRIMARY_URL` does
not update either of these — they require their own code changes. Don't
assume a domain migration is complete just because `APP_PRIMARY_URL` has
been flipped.

## Deployment & Release

Only merge to release branches when:
- All CI/CD checks pass
- All reviews approved
- Changelog updated  
- Version bumped (if applicable)

After merge to main:
- Automated release process may trigger
- Monitor deployment status
- Verify in deployed environment

## Development Workflow Summary

```
Local Development
  ↓
Optional: Local analysis for feedback
  ↓
Create PR & Enable Auto-Merge
  ↓
Automated CI/CD runs (AUTHORITATIVE)
  ↓
Fix failures (if any) & Address PR comments
  ↓
CI/CD passes + Review approved + Comments resolved
  ↓
PR Auto-Merges to main
  ↓
(Optional) Deploy to production
```

## For Test-Driven Development Details

See [Code Quality Standards](./code-quality.md) for TDD workflow and testing strategy.

## For Local Analysis Details  

See [Analysis & Security Standards](./analysis-and-security.md) for when and how to run optional local analysis.
