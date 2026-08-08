## Context

- Relevant architecture: TanStack Start file-based routing (`src/routes/`). `/privacy-policy` (`src/routes/privacy-policy.tsx`) is the direct precedent — a public route rendering `PageLayout` + `Accordion` with static `AccordionItem[]` content, no data loading, no auth.
- Dependencies: `src/components/layout/PageLayout.tsx` (`role="public-marketing"`), `src/components/ui/Accordion.tsx` (`AccordionItem { id, title, content: ReactNode }`, built on native `<details>/<summary>`).
- Interfaces/contracts touched: `src/routes/terms.tsx` (new route, auto-registered into `src/routeTree.gen.ts` by TanStack Router's codegen — not hand-edited). `src/components/auth/RegisterForm.tsx` (existing `<a href="/terms">` → `<Link to="/terms">`).

## Goals / Non-Goals

### Goals

- `/terms` resolves to a rendered Terms of Service page, reachable without authentication, matching `/privacy-policy`'s visual and structural pattern.
- `RegisterForm.tsx`'s TODO is resolved: the Terms link becomes a client-side `<Link>`, consistent with the adjacent Privacy Policy link.
- Content is organized into independently collapsible `Accordion` sections, consistent with the design system's established pattern for long-form legal/informational content.
- All four themes (`dark`, `dark-greens`, `light-cool`, `light-warm`) render the page legibly, per `design-system/CLAUDE.md`.

### Non-Goals

- No governing-law, jurisdiction, or arbitration clause (per proposal Non-Goals).
- No new shared component — `PageLayout` and `Accordion` are reused as-is, no props or behavior changes to either.
- No route guard/auth changes — `/terms` is public, same as `/privacy-policy`.

## Decisions

### Decision 1: New route mirrors `/privacy-policy` file-for-file

- Chosen: `src/routes/terms.tsx` follows the exact same shape as `src/routes/privacy-policy.tsx` — `createFileRoute("/terms")({ component: TermsPage })`, a `SECTIONS: AccordionItem[]` constant, a `LAST_UPDATED` constant, and a `TermsPage()` function rendering `PageLayout` + `Accordion`.
- Alternatives considered: A shared `LegalPage` wrapper component parameterized by section data. Rejected — two instances isn't enough to justify an abstraction (per project convention: "don't design for hypothetical future requirements"), and the two pages already diverge slightly in section count (5 vs. 8), so forcing a shared shape now would constrain future edits to either page independently.
- Rationale: Minimizes new surface area; a future reader who knows `/privacy-policy` immediately understands `/terms`.
- Trade-offs: Any future shared behavior change (e.g. a "print this policy" button) would need to be applied to both files by hand. Acceptable at two instances.

### Decision 2: Content sourced from the exploration-session draft, refined into `AccordionItem[]`

- Chosen: The 8-section draft produced during `/opsx:explore` (Your Account, Your Content, Acceptable Use, Billing & Subscriptions, Third-Party Connections, Termination, Disclaimers, Changes to These Terms) becomes the `SECTIONS` array content, written directly as JSX (matching `privacy-policy.tsx`'s inline `<div className="space-y-3"><p>...</p></div>` pattern per section) rather than sourced from an external CMS or markdown file.
- Alternatives considered: Loading content from a markdown file at build time. Rejected — `/privacy-policy` doesn't do this, and introducing a content-loading mechanism for one page (soon two) is unwarranted infrastructure per project conventions ("prefer in-app over new infra").
- Rationale: Consistency with the established pattern; content changes go through normal code review like any other copy change.
- Trade-offs: Non-technical content edits require a code change/PR rather than a CMS edit. Same trade-off already accepted for the privacy policy.

### Decision 3: "Third-Party Connections" section cross-links to `/privacy-policy` instead of restating data-handling detail

- Chosen: The Terms of Service section on connected clients (e.g. Alexa) states the OAuth consent/revocation mechanism at a terms-of-use level (what you're agreeing to) and links to `/privacy-policy` for the data-handling specifics (what data is/isn't shared), reusing `<Link to="/privacy-policy">`.
- Alternatives considered: Duplicating the privacy policy's "Third-Party Sharing" section content into the terms page. Rejected — creates a content-drift risk (proposal Risks section) where the two pages could diverge on the same factual claim (e.g. the `read:own-content` scope name) if one is updated and not the other.
- Rationale: Single source of truth for data-handling facts stays in the privacy policy; the terms page only needs to establish the *agreement*, not restate the *mechanism*.
- Trade-offs: A reader on `/terms` must follow a link to get full data-sharing detail. Acceptable — this mirrors how real ToS/privacy-policy pairs typically cross-reference rather than duplicate.

### Decision 4: `RegisterForm.tsx` edit is a single-line swap, not a refactor

- Chosen: Change only the `<a href="/terms">...</a>` block (lines ~117-122) to `<Link to="/terms">...</Link>`, matching the existing adjacent `<Link to="/privacy-policy">` block exactly (same className, same text content), and delete the TODO comment above it.
- Alternatives considered: None — this is a mechanical, scoped fix.
- Rationale: `Link` is already imported in this file (used for the Privacy Policy link), so no new import is needed.
- Trade-offs: None identified.

## Proposal to Design Mapping

- Proposal element: New `/terms` route rendering ToS content
  - Design decision: Decision 1 (route mirrors `/privacy-policy`)
  - Validation approach: Manual navigation to `/terms` in dev server; route resolves without 404, no auth required
- Proposal element: ToS content covering account/content/acceptable-use/billing/third-party/termination/disclaimers/changes
  - Design decision: Decision 2 (content as inline `AccordionItem[]`)
  - Validation approach: Manual content review against proposal's Scope section; visual QA in all four themes per `design-system/CLAUDE.md` "done" checklist
- Proposal element: Cross-reference to privacy policy for data-sharing detail, avoiding duplication (Risks section)
  - Design decision: Decision 3 (cross-link, not restate)
  - Validation approach: Manual check that the `/terms` third-party section does not restate the `read:own-content` scope claim verbatim; confirms link target resolves
- Proposal element: `RegisterForm.tsx` `<a>` → `<Link>` swap, TODO removed
  - Design decision: Decision 4
  - Validation approach: Existing `RegisterForm` unit/integration tests (if any assert on the Terms link) updated/pass; manual click-through in dev server confirms client-side nav (no full page reload)

## Functional Requirements Mapping

- Requirement: `/terms` route resolves and renders ToS content for any visitor, authenticated or not
  - Design element: Decision 1
  - Acceptance criteria reference: `specs/terms-of-service-page/spec.md` — Requirement "Terms of Service route resolves"
  - Testability notes: Playwright/E2E or manual navigation check; no auth fixture required
- Requirement: Registration link navigates client-side to `/terms`
  - Design element: Decision 4
  - Acceptance criteria reference: `specs/terms-of-service-page/spec.md` — Requirement "Terms of Service route resolves" (scenario: registration link)
  - Testability notes: Assert `<Link>` (not `<a>`) usage in `RegisterForm.tsx`; E2E click-through asserts no full navigation/reload
- Requirement: Content organized into independently collapsible sections
  - Design element: Decision 2, reuse of `Accordion`
  - Acceptance criteria reference: `specs/terms-of-service-page/spec.md` — Requirement "Content is organized into collapsible sections"
  - Testability notes: Reuses `Accordion`'s existing native `<details>/<summary>` behavior — no new accessibility surface to test beyond confirming 8 distinct `id`s render as independent disclosures
- Requirement: Content covers the 8 named topics without contradicting or duplicating the privacy policy
  - Design element: Decision 2, Decision 3
  - Acceptance criteria reference: `specs/terms-of-service-page/spec.md` — Requirement "Terms content covers required topics"
  - Testability notes: Manual content review checklist against proposal Scope; no automated content-correctness test (legal text isn't machine-checkable)

## Non-Functional Requirements Mapping

- Requirement category: operability / design-system compliance
  - Requirement: Page renders legibly across all four themes, uses only theme tokens (no hardcoded hex), Lucide icons only, no emoji
  - Design element: Decision 1 (reuses `PageLayout`/`Accordion`, which are already theme-token-compliant)
  - Acceptance criteria reference: `specs/terms-of-service-page/spec.md` — Requirement "Terms page follows the design system"
  - Testability notes: Manual visual QA toggling all four themes in the header drawer, per `design-system/CLAUDE.md` "What done looks like" checklist
- Requirement category: security
  - Requirement: `/terms` must not require or leak authenticated state (public route, no session-gated content)
  - Design element: Decision 1 (no route guard added, same as `/privacy-policy`)
  - Acceptance criteria reference: Covered by functional requirement "route resolves for any visitor" — no separate NFAC scenario needed (would duplicate)
  - Testability notes: N/A beyond the functional scenario — see cross-reference rule in specs

## Risks / Trade-offs

- Risk/trade-off: Content is a best-effort draft, not lawyer-reviewed (carried over from proposal Risks).
  - Impact: Same as proposal — potential imprecision in legally consequential sections (billing/termination/disclaimers).
  - Mitigation: Scoped to close the immediate 404 gap with reasonable, non-committal language; highest-risk section (governing law) explicitly excluded (Non-Goal).
- Risk/trade-off: Two near-duplicate route files (`privacy-policy.tsx`, `terms.tsx`) with no shared abstraction (Decision 1).
  - Impact: Minor code duplication (~140 lines of similar scaffolding).
  - Mitigation: Accepted per project convention against premature abstraction at n=2; revisit if a third legal/informational page is added.

## Rollback / Mitigation

- Rollback trigger: Content review post-merge surfaces materially incorrect or legally risky language that shouldn't remain live.
- Rollback steps: Revert the `terms.tsx` addition and the `RegisterForm.tsx` link change via `git revert` of the merge commit; `/terms` returns to 404 (RegisterForm link would need to revert to `<a>` or be temporarily removed to avoid re-introducing the dangling-link problem — prefer fixing content forward over reverting, since reverting re-opens #625).
- Data migration considerations: None — static content, no database or schema involved.
- Verification after rollback: Confirm `/terms` returns to pre-change behavior (404) and `RegisterForm.tsx` no longer references removed content; re-open #625 if reverted.

## Operational Blocking Policy

- If CI checks fail: Diagnose and fix per `tasks.md` Validation section before proceeding; do not merge with failing checks.
- If security checks fail: Treat as blocking — this change touches a public-facing route and auth-form component; any Codacy/Snyk finding must be resolved or explicitly triaged as false-positive before merge, per `CLAUDE.md`'s security guidance.
- If required reviews are blocked/stale: Follow `tasks.md`'s PR-and-Merge iteration policy (address findings, re-request, poll) — escalate to the user if unresolved after 3+ iterations, per the schema's standard tasks rule.
- Escalation path and timeout: No fixed timeout beyond the tasks-artifact standard (report stall to user after 3+ review-fix-push iterations with no progress).

## Open Questions

- Carried from proposal (both non-blocking for apply): refund-policy precision, and whether/when a governing-law clause is added in a future, separately-reviewed change.
