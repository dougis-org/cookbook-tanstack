## GitHub Issues

- #404

## Why

- Problem statement: The `/pricing` page exists but is not discoverable. Anonymous visitors landing on `/` have no path to see pricing options. Authenticated users in the mobile sidebar see no link to pricing either. This creates a conversion gap — users who might upgrade have no entry point to learn about tier differences.
- Why now: The pricing page is complete and functional. Making it discoverable is a prerequisite for any tier-upsell flow.
- Business/user impact: Clear pricing links directly convert interested users into upgrade intent. The sidebar link ensures authenticated users can also discover pricing through normal navigation.

## Problem Space

- Current behavior: The `/pricing` page is orphaned — no navigation element links to it. The header (desktop) has no pricing link. The mobile sidebar (used on all screen sizes) lists Home, Recipes, Categories, Cookbooks, and auth-only actions, but not Pricing. The anonymous home page (`/`) has a single CTA ("Browse Recipes") with no pricing awareness.
- Desired behavior: (1) The mobile sidebar always includes a "Pricing" link between Cookbooks and the auth-only actions. (2) The anonymous home page hero gets a second CTA button ("View Plans and Pricing") alongside "Browse Recipes". (3) The Pricing link uses active-state styling consistent with other nav items.
- Constraints: Must use `<Link>` from `@tanstack/react-router`, not raw `<a>` tags. Active state via `activeProps` on sidebar links. The Pricing page is at `/pricing` (already exists). No changes to authenticated home (`/home`) — other upsell paths will cover that.
- Assumptions: The `/pricing` page is stable and ready for traffic. The sidebar is the primary navigation for all users (mobile-first design). "View Plans and Pricing" is the agreed button copy.
- Edge cases considered: User on `/pricing` page (active state styling). Sidebar shown to unauthenticated users (Pricing link still visible). Sidebar shown to admin users (Pricing link still visible).

## Scope

### In Scope

- Add "Pricing" link to mobile sidebar (`src/components/Header.tsx`) between Cookbooks and auth-only actions (New Recipe, Import Recipe)
- Add "View Plans and Pricing" secondary CTA button to anonymous home page hero (`src/routes/index.tsx`)
- Apply `activeProps` styling to Pricing sidebar link consistent with other nav items
- Update tests: `src/routes/__tests__/-index.test.tsx` (hero CTA), `src/routes/__tests__/-pricing.test.tsx` (sidebar active state)

### Out of Scope

- Changes to authenticated home page (`/home`)
- Changes to desktop header nav (no desktop nav exists — sidebar is universal)
- Modifying the `/pricing` page content or layout
- Any tier-wall or upsell UI (handled in separate `tier-wall-ux` change)
- Payment or subscription flows

## What Changes

- `src/components/Header.tsx` — add Pricing `<Link>` in sidebar nav between Cookbooks and auth-only actions, with `activeProps` for `/pricing` active state
- `src/routes/index.tsx` — add secondary "View Plans and Pricing" `<Link>` button in hero section alongside "Browse Recipes", styled as outline/border to de-emphasize vs primary CTA
- `src/routes/__tests__/-index.test.tsx` — add test asserting "View Plans and Pricing" link renders on anonymous home
- `src/routes/__tests__/-pricing.test.tsx` — add test asserting Pricing link has active styling when on `/pricing`

## Risks

- Risk: Sidebar Pricing link appears before auth-only actions, which changes the visual order users see.
  - Impact: Low — Pricing is a destination page, logically grouped with other destination pages (Home, Recipes, Categories, Cookbooks). Auth actions are separate concerns.
  - Mitigation: Placing Pricing between Cookbooks and the auth actions maintains clear visual grouping.

- Risk: "View Plans and Pricing" button text may wrap awkwardly on small mobile screens.
  - Impact: Low — hero section uses `flex-col sm:flex-row` which stacks on mobile. The button has `px-8 py-3` padding which provides reasonable minimum width.
  - Mitigation: Monitor in testing. If needed, shorten to "View Plans" on `sm:` breakpoint.

## Open Questions

No unresolved ambiguity. All decisions were made during the explore session:
- Sidebar placement: after Cookbooks, before auth actions ✓
- Home page placement: hero section, second button ✓
- Button copy: "View Plans and Pricing" ✓
- Authenticated home: no link needed ✓

## Non-Goals

- Driving conversions through the home page (that's the pricing page's job)
- Changing the visual design of the pricing page
- Adding upsell messaging beyond the link itself
- Modifying header desktop layout (sidebar is universal)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
