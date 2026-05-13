# My CookBooks Web UI Kit

A pixel-accurate, click-through React recreation of the web app from
[`dougis-org/cookbook-tanstack`](https://github.com/dougis-org/cookbook-tanstack),
rebranded to **My CookBooks** with the chosen Open Book + Steam mark and
Fraunces display typeface.

Open `index.html` for an interactive prototype. The header drawer's theme
picker swaps between all four color schemes live — the cyan-on-slate default
plus dark-greens, light-cool, and light-warm.

## Components

| File | Role |
| --- | --- |
| `Icon.jsx`           | Lucide-style 24×24 SVG icons used across the app |
| `Header.jsx`         | Top bar + slide-out drawer + theme picker |
| `PageLayout.jsx`     | Centered container with optional page title |
| `Breadcrumb.jsx`     | Chevron-separated nav row |
| `FormInput.jsx`      | Labelled text input + error message |
| `SearchFilter.jsx`   | Sidebar filter panel for the recipe list |
| `TaxonomyBadge.jsx`  | Pill for meal / course / preparation / classification |
| `RecipeCard.jsx`     | Grid card with image + classification badge + meta |
| `CookbookCard.jsx`   | Cookbook collection card |
| `TierCard.jsx`       | Pricing tier card |
| `App.jsx`            | Demo router + sample data + page components |
| `styles.css`         | All `.cb-*` classes; reads from `../tokens/colors-and-type.css` |

## What the prototype demos

- **Anonymous home** — hero with gradient wash + 3 feature cards
- **Recipes list** — sidebar filter + 3-column card grid + working search
- **Recipe detail** — full ingredients + numbered steps + meta + servings stepper
- **Cookbooks list** — privacy badge + recipe/chapter count
- **Categories** — chips with counts
- **Pricing** — 4 tier cards, "current plan" emphasized ring
- **New Recipe** — form with required-field marker and error state
- **Theme picker** — live preview + OK/Cancel commit

## Known shortcuts

- No real router or auth. Clicking *Login* or *Register* just flips a state
  flag and drops you on the logged-in dashboard.
- Recipe images are CSS gradients — the real app uses ImageKit-hosted
  user photos.
- The font is **Fraunces** (display) + **Inter** (body), substituted for
  the system-font stack the live app uses. Drop the Fraunces import in
  `../tokens/colors-and-type.css` and reset `--font-display` to use the system stack
  if you'd rather match the original.
- Lucide icons are **hand-traced** as inline SVG (no CDN dependency). The
  real app uses `lucide-react`.
