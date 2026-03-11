## Context

M01-M05 are shipped. The stack is fully operational: TanStack Start + React 19 for routing/SSR, tRPC at `src/server/trpc/routers/` for the API layer (already implemented, contrary to the "planned" note in CLAUDE.md), MongoDB/Mongoose for persistence, Tailwind CSS 4 for styling, and Better-Auth for sessions. The recipe detail page (`src/routes/recipes/$recipeId.tsx`) is the primary surface for export and serving adjustment.

## Goals / Non-Goals

**Goals:**
- `@media print` styles that produce clean paper output for recipe detail and list pages
- One-click JSON download of a recipe from its detail page
- JSON import flow with validation and preview before committing
- Client-side ingredient quantity scaler on the recipe detail page

**Non-Goals:**
- PDF export (deferred — adds Puppeteer/browser dependency with significant bundle cost)
- URL scraping for import (deferred — parsing third-party HTML is fragile and out-of-scope for launch)
- Contact form and outbound email delivery (deferred to a dedicated post-launch stream)
- Email notification preferences and per-user recipe notes (deferred — require auth milestone)
- Bulk recipe export

## Decisions

### 1. Print styles via a dedicated CSS file imported in `__root.tsx`

**Decision:** Create `src/styles/print.css` containing only `@media print` rules, import it in `src/routes/__root.tsx` alongside the existing global stylesheet.

**Rationale:** Keeps print concerns separate from utility styles. Tailwind's `print:hidden` / `print:block` utilities will be used on layout components; structural overrides (margins, page breaks, font sizes) go in the dedicated file.

**Alternative considered:** Tailwind-only approach with `print:` variants. Rejected because some rules (e.g. `@page`, `page-break-*`, `orphans`) are not available as Tailwind utilities and require raw CSS.

### 2. JSON export is entirely client-side (no server round-trip for the blob)

**Decision:** The export button reads the already-loaded recipe from React Query cache, serialises it with `JSON.stringify`, wraps it in a `Blob`, and triggers a programmatic `<a download>` click.

**Rationale:** The recipe is already on the client (fetched by `trpc.recipes.byId`). A server round-trip would duplicate work and add latency. The serialised shape re-uses the existing `Recipe` TypeScript interface.

**Alternative considered:** Server-side file generation. Rejected — unnecessary complexity for a simple JSON dump.

### 3. Import validates against the Recipe Zod schema on both client and server

**Decision:** `src/lib/validation.ts` (already exists) will be extended with an `importedRecipeSchema`. The client uses it to surface parse errors before calling the tRPC mutation; the server revalidates before writing to MongoDB.

**Rationale:** Defence-in-depth — the client preview catches user errors fast; server revalidation ensures the DB is never written to with invalid data regardless of how the mutation is called.

### 4. Serving size adjuster is pure client-side state

**Decision:** A `ServingSizeAdjuster` component holds `currentServings` in `useState`, computes a `scaleFactor = currentServings / recipe.servings`, and renders scaled ingredient quantities inline. No persistence.

**Rationale:** Serving adjustment is a view-level convenience. Persisting it per-user requires auth and a schema change — both deferred. The original quantities remain unchanged in the DB.

## Risks / Trade-offs

- **Contact form deferred** → No launch-time email configuration required. Post-launch stream can choose provider, anti-spam strategy, and operational monitoring in one implementation pass.
- **Import JSON schema drift** → If the exported shape changes in a future migration, old exports may not import cleanly. → Add a `_version` field to the export format and include a migration note in the import validation error message.
- **Print styles cross-browser** → `@page` margin support varies. Test in Chrome (primary), note Firefox/Safari limitations in QA checklist.
- **Fraction formatting in serving adjuster** → Scaled quantities may produce irrational decimals (e.g. 1.3333 cups). → Round to 2 decimal places and display as fractions where practical (1/3, 1/2, etc.) using a small utility.
