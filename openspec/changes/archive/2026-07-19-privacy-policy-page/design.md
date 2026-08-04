## Context

`RegisterForm.tsx` (`src/components/auth/RegisterForm.tsx:114-129`) already links to `/privacy-policy`
via a raw `<a>` tag with a TODO noting the route doesn't exist. There is no footer, no other
in-app link to a privacy policy, and no collapsible/accordion UI primitive anywhere in
`src/components/`. The app is a TanStack Start file-based-routing project with a strict
theme-token design system (`design-system/CLAUDE.md`) — four themes (`dark`, `dark-greens`,
`light-cool`, `light-warm`), Fraunces/Inter type scale, Lucide icons only, no hardcoded colors,
no emoji.

Two related but separately-scoped issues exist: #625 (Terms of Service) and #626 (site-wide
footer). Neither is built as part of this change; the route must stand on its own without
depending on footer-based navigation to be reachable (Amazon's OAuth consent screen and the
registration screen are the two real entry points today).

## Goals / Non-Goals

**Goals:**
- Route `/privacy-policy` resolves and renders real content, closing the existing 404
- Content is organized as a single flat page with collapsible sections (native disclosure
  semantics, not a fully custom widget) built on a new shared `Accordion` component
- Content is forward-looking: describes Alexa/OAuth account-linking data sharing and its
  revocability truthfully, even though `@better-auth/oauth-provider` (#616) and the settings-side
  revocation UI (#627) haven't shipped yet
- `RegisterForm.tsx`'s `/privacy-policy` link becomes a real `<Link>`

**Non-Goals:**
- `/terms` route, footer, or pricing FAQ (tracked separately, see proposal Scope)
- Building OAuth revocation itself (#627) — this change only makes the policy's claim true by
  reference to that tracked, dependent issue
- A markdown/CMS content pipeline — JSX only, per proposal decision (#4 in exploration)
- Legal review/sign-off — flagged as a task requiring human approval before merge, not something
  this design can resolve

## Decisions

### Route implementation: plain JSX route, not markdown-driven

`src/routes/privacy-policy.tsx` follows the existing route-component pattern (`createFileRoute`
+ named page function). No markdown rendering pipeline exists in this codebase and building one
for a single page would be scope creep beyond what #621 asks for. Content lives directly in JSX,
broken into per-section objects/consts within the same file (or a co-located
`privacy-policy-content.ts` data file) so the section text is easy to find and edit without
touching component structure.

**Alternative considered**: render from a markdown file under `docs/legal/`. Rejected for now —
no existing infra to parse/render markdown into a themed route, and the win (non-engineer
editability) doesn't outweigh building a new pattern for one page. Revisit if `/terms` (#625) or
future legal pages make a shared content pipeline worth it.

### Shared `Accordion` component: minimal API, not over-built for the FAQ that doesn't exist yet

`src/components/ui/Accordion.tsx` exports:
- `Accordion` — container, accepts `items: { id: string; title: string; content: ReactNode }[]`
  and `defaultOpenId?: string`
- Built on native `<details>/<summary>` semantics internally (for accessibility and free
  keyboard/screen-reader support) but styled to match the design system (theme-token borders,
  `rounded-lg`, `transition-transform` on the chevron icon, Lucide `ChevronDown`)
- Single-open-or-multi-open behavior: **multi-open** (each section toggles independently) — this
  matches a privacy policy's "expand what you care about" reading pattern better than
  accordion-style single-open, and avoids adding an `allowMultiple` prop distinction the FAQ
  use case (#430) doesn't clearly need yet either

**Alternative considered**: build a `useState`-driven custom div/button implementation instead of
`<details>`. Rejected — `<details>` gets focus management, `Escape`-to-close-adjacent behavior in
some browsers, and semantic `aria-expanded` equivalents for free; reinventing that is exactly the
kind of avoidable complexity the project's simplicity conventions warn against.

**Alternative considered**: build this later, scoped only to the FAQ (#430), and use inline
`<details>` for this page now. Rejected per explicit user decision during exploration — the
shared component is being seeded now, deliberately, so #430 doesn't re-derive the same pattern.

### Content structure: five sections, in this order

1. **Your Account** — Better-Auth fields collected (email, username, display name, password
   handling, sessions)
2. **Your Recipes & Cookbooks** — user-generated content, ownership, embedded taxonomy
3. **Billing** — Stripe: card data never touches our servers; we store customer/subscription IDs
   and tier status only
4. **Third-Party Sharing** — transactional email (Nodemailer, recipient address only) and OAuth
   account linking (Alexa): scope granted (`read:own-content`, read-only), what is explicitly
   *not* shared (password, email, payment data), PKCE-based consent flow, and a revocability
   statement referencing the settings capability tracked in #627
5. **Changes to This Policy** — how updates are communicated, "Last updated" date line

### "Last updated" convention: static string, manually maintained

A literal `Last updated: <Month DD, YYYY>` line at the top of the page, updated by hand whenever
policy content changes. No build-time date injection, no version history mechanism. This is the
simplest option that satisfies the immediate need; revisit only if policy edits become frequent
enough to justify automation (no evidence of that yet).

**Alternative considered**: build-time injected date (e.g., from git log or CI). Rejected as
premature — one page, infrequent edits, no current tooling for it.

### Contact address: `privacy@mycookbooks.com`, hardcoded in content

Per user decision during proposal review, a dedicated privacy contact email. No env var or config
plumbing needed — it's static legal-page content, not app configuration.

### `RegisterForm.tsx` update: `/privacy-policy` link only

The existing TODO comment covers both `/terms` and `/privacy-policy`. Only the privacy-policy
half of the TODO resolves in this change (`/terms` stays a raw `<a>` until #625 lands). The TODO
comment is updated to reflect that split, not removed entirely.

## Risks / Trade-offs

- [Risk] Forward-looking OAuth content describes a flow (`@better-auth/oauth-provider`) that
  doesn't exist in `src/lib/auth.ts` yet → [Mitigation] Language is written in terms of what the
  *feature* does when a user opts in, not implementation specifics that could drift; #616 is the
  single source of truth for the actual mechanism and this page doesn't need to change when #616
  merges unless the mechanism itself changes shape.
- [Risk] `Accordion` built for two consumers, only one of which (this page) exists today →
  [Mitigation] API kept intentionally small (see Decisions); no props added speculatively for the
  FAQ beyond what a generic multi-section disclosure list needs.
- [Risk] Legal sufficiency of the policy text is outside this design's competence →
  [Mitigation] tasks.md includes an explicit human-review checkpoint before merge; this change
  does not claim legal sign-off.
- [Trade-off] Content lives inline in the route/component rather than a separately editable
  content file → acceptable for a single page; would need revisiting if `/terms` (#625) makes a
  second near-identical page that argues for shared structure.

## Open Questions

None outstanding — the proposal's two open questions (last-updated convention, contact method)
were both resolved above.
