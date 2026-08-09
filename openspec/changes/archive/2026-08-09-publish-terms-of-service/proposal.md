## GitHub Issues

- #625

## Why

- Problem statement: `src/components/auth/RegisterForm.tsx:114` links to `/terms`, which 404s today. The register screen has carried a TODO since the privacy policy shipped (#621) — *"Replace `<a>` with `<Link>` for /terms once that route is created"* — because Terms of Service was deliberately split out of #621's scope.
- Why now: #621 (privacy policy) is closed and its route (`/privacy-policy`) is live, so the only remaining piece of the register-page dangling-link problem is Terms of Service.
- Business/user impact: A 404 on a legal-consent link at the point of account creation is a trust signal failure, however small. New users clicking "Terms" during signup currently hit a broken page.

## Problem Space

- Current behavior: `/terms` has no route. `RegisterForm.tsx` links to it with a raw `<a href="/terms">` (not `<Link>`, since the route doesn't exist and TanStack Router would fail to resolve it).
- Desired behavior: `/terms` resolves to a published Terms of Service page, reachable without authentication, and the register-page link becomes a `<Link to="/terms">`, matching the pattern already used for `/privacy-policy`.
- Constraints: Content and structure must align with the existing `/privacy-policy` page (`src/routes/privacy-policy.tsx`) — same `PageLayout role="public-marketing"` + `Accordion` shell, same tone, same `LAST_UPDATED` / contact-email closing pattern — so the two legal pages read as one system per `design-system/CLAUDE.md`.
- Assumptions:
  - Content drafted in this exploration session (8 sections: Your Account, Your Content, Acceptable Use, Billing & Subscriptions, Third-Party Connections, Termination, Disclaimers, Changes to These Terms) is a reasonable starting draft, not lawyer-reviewed final copy. See Risks.
  - Contact email reuses `privacy@mycookbooks.com` (no dedicated `legal@` address exists).
  - Age threshold is stated as 13+, matching common US COPPA baseline; not jurisdiction-specific legal advice.
- Edge cases considered:
  - No governing-law / dispute-resolution / arbitration clause is included — deliberately out of scope (see Non-Goals), since that section carries more legal risk than the rest and the issue's own scope doesn't require it.
  - The page must not silently duplicate or contradict `/privacy-policy` — the "Third-Party Connections" section here cross-links to it rather than restating data-handling detail.

## Scope

### In Scope

- New `/terms` route (`src/routes/terms.tsx`) mirroring `src/routes/privacy-policy.tsx`'s structure: `PageLayout` + `Accordion` of `AccordionItem[]`.
- Terms of Service content covering: account creation/eligibility, user-generated content ownership/license, acceptable use, tier/billing terms (Stripe-based subscriptions), third-party (OAuth) connections, termination, disclaimers, and a "Changes to These Terms" closing section.
- Update `src/components/auth/RegisterForm.tsx` (~line 114-121): replace `<a href="/terms">` with `<Link to="/terms">`, remove the now-resolved TODO comment.

### Out of Scope

- Any change to `/privacy-policy` content or route.
- Governing law, jurisdiction, or arbitration clause content (see Non-Goals).
- Legal review/sign-off process — this proposal produces a reasonable draft, not counsel-approved language.
- Alexa skill certification or account-linking consent screens (those were #615/#616's concern, already resolved via the privacy policy).

## What Changes

- Add `src/routes/terms.tsx` — new public route rendering Terms of Service content via the shared `Accordion` component.
- Add a new capability spec `terms-of-service-page`, modeled directly on the existing `privacy-policy-page` capability spec (`openspec/specs/privacy-policy-page/spec.md`).
- Modify `src/components/auth/RegisterForm.tsx` to use `<Link to="/terms">` instead of a raw anchor tag, closing out the TODO referencing #625.

## Risks

- Risk: Terms of Service content is legally consequential (liability, billing terms, termination rights) in a way a privacy policy summary is not.
  - Impact: Shipping imprecise or incomplete ToS language could create disputes it was meant to prevent.
  - Mitigation: Content is scoped to close the immediate 404/dangling-link gap using plain, reasonable language consistent with actual app behavior (Stripe billing, no refund guarantees beyond stated policy, account-deletion behavior). Governing-law/arbitration language — the highest-risk section — is explicitly excluded from this change rather than guessed at. Flagged to the requester as worth a lawyer's pass before or shortly after this ships.
- Risk: Content drift between `/terms` and `/privacy-policy` if either changes independently later (e.g. new data-sharing behavior added to one but not reflected in the other's cross-reference).
  - Impact: Minor — the two pages describe different subject matter (usage terms vs. data handling) and only intersect at the "third-party connections" cross-link.
  - Mitigation: Keep the cross-link (`/terms` → `/privacy-policy`) as a pointer rather than duplicating privacy-policy content in the terms page.

## Open Questions

- Question: Should refund policy be stated more precisely (e.g. explicit "no refunds" vs. a case-by-case "reach out" framing) than the current draft's soft middle ground?
  - Needed from: dougis
  - Blocker for apply: no — draft ships with the soft framing already used in the exploration-session draft unless revised.
- Question: Should a governing-law/arbitration clause be added in a follow-up change once reviewed by counsel, or left out indefinitely?
  - Needed from: dougis
  - Blocker for apply: no — tracked as a Non-Goal for this change regardless of answer.

## Non-Goals

- Adding a governing-law, jurisdiction, or arbitration clause.
- Establishing a formal legal-review workflow for future policy changes.
- Introducing a dedicated `legal@` contact address (reuses `privacy@mycookbooks.com`).
- Any change to Alexa account-linking consent flows.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
