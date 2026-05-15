# F08 — Defer email verification past the first satisfying action

## Context

Today `requireVerifiedAuth` blocks `/recipes/new`, `/import`, and `/change-tier`. So a new user signs up → sees "check your email" → leaves the app → finds the verification email → clicks the link → comes back → finally makes a recipe. That's three context switches before any value is felt.

Verification matters, but not before the user has felt the product work for them.

## Acceptance criteria

- [ ] Unverified users can reach `/recipes/new` and fill in the form.
- [ ] On submit, if the user is unverified, the recipe is saved to the database (so they don't lose work) with a `pendingVerification: true` flag, or kept in `sessionStorage` if a DB write is preferred only after verification.
- [ ] After submit, the unverified user lands on a friendly verification gate: *"One more step — verify your email to publish this recipe."* with a "Resend verification email" button. Their recipe is shown above the gate so they see they didn't lose it.
- [ ] Once verified (via email link → returns to app → session refresh), pending recipes finalise automatically.
- [ ] `/import` and `/change-tier` keep `requireVerifiedAuth` for now — those are higher-stakes actions where the verification gate makes sense.
- [ ] `VerificationBanner` continues to render on all authed pages for unverified users (already does).

## Where to start

- `src/routes/recipes/new.tsx` — switch from `requireVerifiedAuth` to `requireAuth`
- `src/components/auth/VerificationBanner.tsx` — already covers the persistent banner; reuse the resend logic
- `src/db/models/recipe.ts` — add the `pendingVerification` boolean OR persist in `sessionStorage` (your call; document the trade-off)
- `src/components/recipes/RecipeForm.tsx` — handle the unverified-submit branch
- New: a small `<PostSubmitVerifyGate>` component for the post-submit state

## Constraints

- Theme tokens only.
- No emoji.
- The unverified recipe must not be publicly visible (taxonomy queries, recipe lists, etc.) until the user is verified. Server-side filter in tRPC.
- Don't break existing tests for `/recipes/new` — extend them.

## Open question

If the user never verifies, do we eventually delete pending recipes? Suggest: keep for 30 days then delete with a final warning email. Implement this in a follow-up issue, not this one.

@claude please open a PR. Include a tRPC test confirming pending recipes never leak into public list queries.
