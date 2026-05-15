# F03 — Rewrite landing page to sell the product

## Context

The current public homepage (`src/routes/index.tsx`) has three problems:

1. **Hero says the wrong name.** It renders "CookBook" — the brand name is **My CookBooks** (capital C, capital B, joined). See `design-system/CLAUDE.md` "Brand name" rule.
2. **All three feature cards describe browsing.** "Recipe Collection", "Categories", "Search & Filter" are the same feature surfaced three times.
3. **No mention of the paid value props.** Save, organise, import, share, print — none of these appear. The page sells a public recipe browser, not the product.

## Acceptance criteria

- [ ] Hero text reads "My CookBooks" (gradient `bg-clip-text` fill on the wordmark, Fraunces 600 with `SOFT 80, WONK 1`).
- [ ] Tagline kept: "Your Personal Recipe Management System".
- [ ] Sub-tagline rewritten to convey the action: e.g. "Save every recipe. Build cookbooks. Cook from any device."
- [ ] Feature section replaced with **verb-led** cards. Suggested set (4 cards):
  - **Save** — "Capture any recipe in seconds. Title, ingredients, steps, your own notes."
  - **Organise** — "Sort into cookbooks. Tag by meal, course, prep. Find anything in a click."
  - **Import** — "Bring recipes in from JSON exports or paste a URL. Available on Executive Chef."
  - **Print** — "Recipe and cookbook print layouts that look good on paper."
- [ ] Primary CTA above the fold: "Start free — no credit card" → `/auth/register`. Secondary: "Browse public recipes" → `/recipes`.
- [ ] Add a screenshot or visual of the actual app below the hero. Acceptable: a slot using `<image-slot>` for the user to drop in later, or a placeholder card with a `BookOpen` Lucide icon.
- [ ] A "Plans start at $2.99/mo" line near the primary CTA, linking to `/pricing`.

## Where to start

- `src/routes/index.tsx`
- Brand mark: `design-system/assets/logo-mark.svg` (use this in place of the inline `ChefHat` for the hero — falls back to `ChefHat` if needed)
- Reference for hero styling: existing wordmark CSS in the file already uses the gradient correctly.

## Constraints

- Theme tokens only.
- No emoji.
- Title Case for CTAs, Sentence case for body copy.
- Lucide for icons (existing pattern).
- The single existing gradient (`bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10`) is OK to keep on the hero. Don't add new gradients elsewhere.

## Out of scope

- Pricing page redesign (F09)
- Register form changes (F10)

@claude please open a PR. If the new layout calls for an image of the app and none exists, render an `<image-slot id="landing-screenshot" placeholder="Add a screenshot of /recipes">` and tell me what to drop in.
