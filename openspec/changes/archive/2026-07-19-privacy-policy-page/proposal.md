## GitHub Issues

- #621

## Why

- Problem statement: My CookBooks has no privacy policy today. `RegisterForm.tsx` already links to `/privacy-policy` (and `/terms`), but the route doesn't exist — the link 404s. Amazon's Alexa account-linking work (#615/#616) requires a published privacy-policy URL for OAuth consent screens, and #615's acceptance criteria requires diffing certification gaps against "the current app privacy policy," which doesn't exist to diff against.
- Why now: #615 (Alexa discovery spike) is blocked without a baseline policy; #616 (OAuth account-linking consent page) needs a privacy-policy link to be complete.
- Business/user impact: Closes a real, live broken link on the registration screen and unblocks the Alexa integration chain (#615 → #616 → #617 → #618 → #619 → #620). Also gives users an honest, findable account of what data the app collects and shares.

## Problem Space

- Current behavior: `/privacy-policy` and `/terms` both 404. No footer or other in-app navigation links to either. No accordion/collapsible UI primitive exists anywhere in `src/components/`.
- Desired behavior: `/privacy-policy` renders a single flat page with content organized into collapsible sections (Accounts, Recipes/Cookbooks Content, Billing, Third-Party Sharing, Changes to this Policy). `RegisterForm.tsx`'s existing link resolves instead of 404ing.
- Constraints: Design-system rules apply (theme tokens only, no hardcoded colors, Fraunces/Inter type scale, Lucide icons, no emoji) per `design-system/CLAUDE.md`. Must render legibly across all four themes (`dark`, `dark-greens`, `light-cool`, `light-warm`).
- Assumptions:
  - The policy is written forward-looking: it describes Alexa/OAuth account-linking data sharing (scope `read:own-content`, PKCE, revocable) as if `@better-auth/oauth-provider` (#616) already exists, even though that work hasn't landed yet. This is a deliberate choice made during exploration so #615's certification-gap analysis has a real baseline to diff against, and so the policy doesn't need a second rewrite pass once #616 ships.
  - The revocability claim in the policy is backed by a real settings capability tracked separately (#627) rather than built as part of this change.
  - `/terms` is explicitly out of scope for this change (tracked as issue #625) even though it has the identical 404 problem.
  - A site-wide footer is out of scope for this change (tracked as issue #626); this change only needs to make the route resolve, not solve app-wide discoverability.
- Edge cases considered:
  - Users on any of the four themes must be able to read the page (no hardcoded slate/cyan hex values).
  - The page must work as a normal route (not gated behind auth) since Amazon's consent screen and prospective users both need to reach it unauthenticated.
  - Collapsible sections must remain keyboard- and screen-reader-accessible (native disclosure semantics), not a custom implementation.

## Scope

### In Scope

- A new `/privacy-policy` route rendering the policy content
- A new shared `Accordion` component (`src/components/ui/Accordion.tsx`) used to implement the collapsible sections, written generically enough for later reuse by the (currently unbuilt) pricing-page FAQ (#430/F09 handoff notes)
- Policy content covering: account data (Better-Auth: email, username, display name, password/session handling), user-generated content (recipes/cookbooks), billing (Stripe — card data never touches our servers, but customer/subscription IDs are stored), transactional email (Nodemailer — recipient addresses), and third-party data sharing via Alexa/OAuth account linking (scope granted, what is *not* shared, revocability)
- Updating `RegisterForm.tsx`'s `/privacy-policy` link from raw `<a>` to TanStack Router `<Link>` (the `/terms` half of that TODO stays as `<a>` until #625 lands, per this change's scope)

### Out of Scope

- `/terms` route and Terms of Service content (#625)
- Site-wide footer / app-wide navigation to the policy (#626)
- Building the actual OAuth revocation capability in account settings (companion issue to be filed for this change — see Non-Goals)
- The pricing-page FAQ accordion itself (#430/F09) — only the shared `Accordion` primitive is built now, not that page

## What Changes

- Add `src/routes/privacy-policy.tsx` (or equivalent file-based route) rendering the policy page
- Add `src/components/ui/Accordion.tsx`, a theme-token-styled collapsible section component
- Update `src/components/auth/RegisterForm.tsx` to use `<Link to="/privacy-policy">` instead of `<a href="/privacy-policy">`, removing half of the existing TODO comment
- New OpenSpec capabilities: `privacy-policy-page` (route/content) and `ui-accordion` (shared component)

## Risks

- Risk: Policy claims a capability (OAuth revocation from settings) that doesn't exist in the product yet.
  - Impact: If a user tries to revoke Alexa access today, there's nowhere to do it — the policy would be misleading until that capability ships.
  - Mitigation: Settings-side revocation UI is already tracked as #627 (filed during exploration), blocked on #616. Treat it as a near-term dependency of this policy being fully honest, not a someday-maybe.
- Risk: Building a new shared `Accordion` component ahead of its second consumer (the pricing FAQ, #430) risks over-generalizing for a use case that isn't real yet.
  - Impact: Extra API surface / props that only make sense in hindsight once the FAQ is actually built.
  - Mitigation: Keep the component's API minimal (single-section-open-or-multi-open behavior, no more) and let the FAQ's actual requirements adjust it later rather than guessing now.
- Risk: Legal/compliance accuracy of the policy content itself — this is written by an engineering change process, not reviewed by counsel.
  - Impact: Policy language could be legally insufficient despite being technically accurate about data flows.
  - Mitigation: Explicitly flag in tasks.md that a human (the user, i.e. site owner) reviews and approves final policy copy before merge; this proposal does not claim legal sign-off.

- Question: What "last updated" / versioning convention should the policy footer use (static date string vs. build-time injection)?
  - Needed from: design.md decision — no existing convention in this codebase to follow, so this needs a decision made during design, not left open into implementation.
  - Blocker for apply: no (a reasonable default — a static `Last updated: <date>` line — can be chosen in design.md without further user input)

No other unresolved ambiguity remains: the contact method (dedicated `privacy@mycookbooks.com` address) was confirmed by the user during proposal review.

## Non-Goals

- This change does not build the OAuth-revocation settings UI the policy describes as available. That is tracked separately as #627 ("Allow revoking connected Alexa/OAuth account linking from settings"), blocked on #616.
- This change does not build `/terms` (#625), a site-wide footer (#626), or the pricing-page FAQ — all tracked separately per Scope.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
