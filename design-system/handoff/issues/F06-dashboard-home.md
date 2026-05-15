# F06 — Authed home as a dashboard

## Context

`src/routes/home.tsx` today is two columns of generic links: "Quick Actions" and "Discovery". There's no signal about the user's actual data — no usage, no recent activity, no surface for a contextual upgrade nudge.

Reference mock: `funnel-mocks.html` → "F6 — Authed home as dashboard" artboard.

## Acceptance criteria

- [ ] Greeting line: "Welcome back, {firstName}" + a one-line activity stat ("You've cooked 3 recipes this week" — pull from view-count or marked-recipe events if available; if not, just show today's date).
- [ ] **Usage card** at the top: three blocks (Recipes / Cookbooks / This month), each with a value, progress bar where applicable, and tier name as caption. Reuse `<ProgressBar>` from `/account`.
- [ ] **Quick actions** row: "+ New Recipe" (primary) and "Import Recipe" (secondary or disabled with tier badge if user is below Executive Chef).
- [ ] **Recently saved** section: 3–4 recipe thumbnails, fetched from `trpc.recipes.list` sorted by `createdAt` desc, limited to recipes owned by the current user. Click → `/recipes/$id`. "View all →" link to `/recipes`.
- [ ] **Contextual upgrade nudge** at the bottom, shown only when at least one of: cookbook count at limit, recipe count ≥ 80%, or user attempted a paid-only action in the last 7 days. Otherwise hidden.
- [ ] Nudge copy is data-driven: if cookbook limit hit, it says "Ready to build a second cookbook?"; if recipe approaching, it says "Running out of room?"; etc.

## Where to start

- `src/routes/home.tsx` — the file to rewrite
- `src/hooks/useAuth.ts` — for the user object
- `src/lib/trpc.ts` — usage data via `trpc.usage.getOwned`, recipes via `trpc.recipes.list`
- `src/lib/tier-entitlements.ts` — for limits + next-tier lookup
- Reference mock: `funnel-mocks/Dashboard.jsx` in the design-system project

## Constraints

- Theme tokens only.
- No emoji.
- Lucide icons throughout (`ChefHat`, `BookOpen`, `Plus`, `Download`).
- Page role stays `authenticated-home` (used by F02 for the ad slot — coordinate placement so they don't fight).

## Out of scope

- F02 ad slot — separate PR. If F02 has shipped first, the ad slot lives between greeting and usage card (don't duplicate placement logic here).
- Paywall nudge component (F05) — this page consumes it but doesn't define it.

@claude please open a PR. Include tests for the conditional nudge logic — at least one test each for the "cookbook limit hit", "recipe approaching", and "nothing to nudge" cases.
