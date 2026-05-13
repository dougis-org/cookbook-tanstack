# My CookBooks — Design System

This folder is the **source of truth** for the My CookBooks visual identity.
Every screen, marketing page, slide, and prototype should pull from here. If
you find yourself reaching for a hex value, a font-family, or a spacing
number that isn't in this folder, **add it here first** and then use the
token — don't fork.

Distilled from the live application in `src/styles/*` and `src/components/*`.
This folder doesn't ship to runtime; it documents the system the runtime
implements and gives designers / agents a stable surface to read.

---

## Contents

```
design-system/
├── README.md                       ← you are here
├── CLAUDE.md                       ← agent guidance (linked from root CLAUDE.md)
├── tokens/
│   └── colors-and-type.css         ← all 4 themes + Fraunces/Inter scale
├── assets/
│   ├── logo-lockup.svg             ← mark + "My CookBooks" wordmark
│   ├── logo-mark.svg               ← mark only, currentColor
│   ├── favicon.svg                 ← mark on slate-900 rounded square
│   └── favicon-32/192/512.png      ← raster sizes for PWA + Apple touch
└── components/
    ├── index.html                  ← click-thru prototype of the whole app
    ├── README.md
    ├── styles.css                  ← .cb-* class layer reading --theme-* tokens
    ├── App.jsx                     ← demo router + sample data
    ├── Header.jsx, RecipeCard.jsx, CookbookCard.jsx, TaxonomyBadge.jsx,
    ├── TierCard.jsx, FormInput.jsx, Breadcrumb.jsx, PageLayout.jsx,
    └── SearchFilter.jsx, Icon.jsx
```

> The JSX in `components/` is a **reference recreation** — pixel-accurate
> with the real app but written in plain JSX with hand-traced Lucide icons
> so it runs standalone. Production components live in `src/components/`
> and use TypeScript + `lucide-react`. When you change a pattern, change
> both places (or extract to a shared component the runtime imports).

---

## Quick start

### In production code
The runtime already implements these tokens. Just keep using them:

```tsx
<div className="bg-[var(--theme-surface)] border border-[var(--theme-border)]
                rounded-lg p-4 hover:shadow-[var(--theme-shadow-md)]">
  ...
</div>
```

### In a standalone prototype / marketing page
```html
<link rel="stylesheet" href="/design-system/tokens/colors-and-type.css">
<html class="dark">  <!-- or dark-greens | light-cool | light-warm -->
```

Then open `components/index.html` for live patterns to copy.

---

## The four themes

| Theme         | Page bg              | Accent             | When to default                |
| ------------- | -------------------- | ------------------ | ------------------------------ |
| `dark`        | slate-900 `#0f172a`  | cyan-400 `#22d3ee` | App default. Tech-forward.     |
| `dark-greens` | teal `#103c48`       | lime `#75b938`     | Selenized retro cozy.          |
| `light-cool`  | slate-100 `#f1f5f9`  | blue-600 `#2563eb` | Office productivity.           |
| `light-warm`  | amber-50 `#fffbeb`   | amber-700 `#b45309`| Cookbook daylight.             |

The active theme is a class on `<html>`, persisted to
`localStorage["cookbook-theme"]`. Every surface reads `var(--theme-*)`
tokens — never hard-code a slate or cyan hex.

---

## Type

**Fraunces** (display, Google Fonts) + **Inter** (body) + **JetBrains Mono**
(code). The live app currently uses the system stack — this folder defines
the *chosen brand direction* on top of it. To revert, drop the Fraunces
import in `tokens/colors-and-type.css` and reset `--font-display` to match
`--font-sans`.

See `tokens/colors-and-type.css` for the full scale and
`CLAUDE.md` for usage rules.

---

## House rules (the short list)

1. **No emoji.** Anywhere. Lucide icons carry the iconographic load. `✓` and
   `·` are allowed as inline glyphs.
2. **Theme tokens, not hex.** Use `var(--theme-accent)`, not `#22d3ee`.
3. **Title Case** nav + CTAs · **Sentence case** body · **UPPERCASE
   tracking-wider** eyebrows (the only one in chrome is `THEME`).
4. **Second person.** "Your recipes", never "Our recipes" or "The user's
   recipes".
5. **The brand name is `My CookBooks`** — capital `C` and capital `B`,
   joined.
6. **Lucide for icons.** `lucide-react` in production. No emoji, no
   Heroicons, no custom icon font.
7. **Flat surfaces, sparing transparency.** The only gradient is the hero
   wash + the wordmark `bg-clip-text` fill.
8. **Subtle, fast animations.** `transition-colors` / `transition-shadow` /
   `transition-transform`, no springs, no bounces, no entrance fades.

Full guidance for AI agents in `CLAUDE.md`.

---

## Maintenance

When you change a token or pattern in the live app:

1. Update `tokens/colors-and-type.css` to match the new value.
2. If a component pattern changed (border-radius, padding rhythm, shadow
   recipe), update the relevant `.jsx` in `components/` so the reference
   prototype stays accurate.
3. If the rule itself changed (e.g. you start using a new icon library,
   change the casing rule, allow emoji in marketing), update `CLAUDE.md`
   so agents pick it up next session.

---

## Caveats

- The JSX recreations don't have routing or auth — they're for visual
  reference. Don't import from `design-system/components/` at runtime.
- Lucide icons in `components/Icon.jsx` are hand-traced (the 20 most-used
  ones) so the prototype runs without a CDN. Production code uses
  `lucide-react`.
- Favicons are duplicated here for portability. The actual files served by
  the app live under `public/`.
