# Design System — agent guidance

You are working in the **My CookBooks** TanStack Start codebase. This file
tells you how the product looks, sounds, and feels so that any UI you
generate matches the rest of the app on first try. Read this before writing
or editing any user-facing surface (component, route, marketing page,
email, slide).

The full system is documented in `design-system/README.md`; this file is
the short-form ruleset you must follow when generating code.

---

## Where things live

| You need…                          | Open…                                      |
| ---------------------------------- | ------------------------------------------ |
| Color + type tokens                | `design-system/tokens/colors-and-type.css` |
| Logo / wordmark / favicons         | `design-system/assets/`                    |
| Reference component implementations| `design-system/components/`                |
| Click-through visual reference     | `design-system/components/index.html`      |
| Production components              | `src/components/`                          |
| Production styles                  | `src/styles/`                              |

When a token or pattern exists in `design-system/`, **use it**. Don't
re-derive hex values or re-invent spacing.

---

## Brand name

The product is **My CookBooks**. Capital `C`, capital `B`, joined into one
word. Never `My Cookbooks`, never `Mycookbooks`, never `MyCookBooks`. Use
the full name on first reference and in any lockup; the chrome wordmark
shows just `My CookBooks`. The tagline is *Your Personal Recipe Management
System*.

---

## Color

The app is **theme-driven** — every surface reads `--theme-*` CSS custom
properties. The active theme is a class on `<html>` and there are four:
`dark` (default), `dark-greens`, `light-cool`, `light-warm`. The user
picks; the app honours.

**Rules:**
- Use `var(--theme-bg)`, `var(--theme-surface)`, `var(--theme-surface-raised)`,
  `var(--theme-surface-hover)`, `var(--theme-fg)`, `var(--theme-fg-muted)`,
  `var(--theme-fg-subtle)`, `var(--theme-accent)`, `var(--theme-accent-hover)`,
  `var(--theme-border)`, `var(--theme-border-muted)`, `var(--theme-shadow-sm)`,
  `var(--theme-shadow-md)`.
- **Never hard-code a slate/cyan/teal/amber hex.** The handful of exceptions
  baked into the codebase: `text-red-500` for the saved-recipe heart,
  taxonomy badge color families (amber/violet/emerald/cyan — they hold
  across themes on purpose), and white on the accent fill of primary
  buttons.
- Test every new surface against all four themes before declaring it done.
  If something looks fine on `dark` but illegible on `light-warm`, the
  token usage is wrong.

**Taxonomy badge colors** (don't theme-swap these):
- meal → amber
- course → violet
- preparation → emerald
- classification → cyan

---

## Type

**Fraunces** (display) + **Inter** (body) + **JetBrains Mono** (code). All
three are Google Fonts.

- Wordmark / page titles / section headers / card titles → Fraunces
- Body / UI / buttons / form labels / meta → Inter
- Code blocks → JetBrains Mono

Fraunces uses `font-variation-settings: "SOFT" 80, "WONK" 1` on the
wordmark and `"SOFT" 80, "WONK" 0` on regular headings. Italic Fraunces
appears in the hero tagline and big-quote slides.

Scale (use the existing Tailwind utilities + `--font-display`):
- Wordmark — Fraunces 600, `clamp(3rem, 6vw, 4.5rem)`, tracking `-0.035em`
- H1 — Fraunces 600, 44px, tracking `-0.025em`
- H2 — Fraunces 600, 28px, tracking `-0.02em`
- H3 — Fraunces 600, 22px, tracking `-0.015em`
- Body — Inter 400, 16px, line-height 1.5
- Small / meta — Inter 400, 14px, `text-fg-muted`
- Eyebrow — Inter 500, 12px, `uppercase tracking-wider`

---

## Voice & tone

**Friendly. Practical. Cook-first, dev-never.** Short sentence fragments,
present tense, no marketing puffery. Address the reader directly with
**you** ("Add a new recipe to **your** collection", "**View your** plans").
Crisp imperative verbs on CTAs ("Browse Recipes", "Import Recipe", "Get
Started for Free"). *The helpful kitchen friend*, never the food
influencer.

**Casing:**
- **Title Case** — nav, page titles, primary CTAs ("Browse Recipes")
- **Sentence case** — body, descriptions, form labels
- **UPPERCASE tracking-wider** — tiny eyebrow labels in chrome (the only
  one in source is `THEME` above the drawer's theme picker)
- **lowercase-hyphenated** — tier identifiers in code (`home-cook`,
  `prep-cook`, `sous-chef`, `executive-chef`). The UI displays them
  Title-Cased via `TIER_DISPLAY_NAMES`.

**Person:** Second person, always. "Your collection", never "the user's
collection".

**Auth language:** *Login* / *Register* — not *Sign in* / *Sign up*.

**Empty state placeholder:** `N/A` — not `—`, not `None`, not `--`.

---

## No emoji

There are zero emoji anywhere in the UI. Lucide carries all iconographic
load. Allowed Unicode characters:
- `✓` (U+2713) — soft "yes" on tier cards
- `·` (U+00B7) — separates inline meta (`3 recipes · 2 chapters`)
- `…` (U+2026) — placeholder ellipsis (`Search recipes…`)

If you find yourself wanting a 🚀 or a 🍳, you are about to break the
brand. Reach for a Lucide icon instead.

---

## Iconography

**Lucide React.** Already a dependency (`lucide-react`). Use it in all
production code:

```tsx
import { ChefHat, BookOpen, Search } from 'lucide-react'
```

Standard sizes: 16–24px in chrome, 12px for inline badge accents, 24–32px
on landing-page feature cards, 96–128px for hero. Stroke width is Lucide's
default (don't override). Color is **always** `currentColor` or a
`--theme-*` token — icons inherit text color. Exceptions: `text-red-500`
on the saved-recipe `Heart`, `text-[var(--theme-accent)]` on the "you own
this" `User` chip.

Brand mark is `ChefHat` in chrome, the Open Book + Steam SVG in marketing
lockups (see `design-system/assets/logo-mark.svg`).

---

## Layout & spacing

Tailwind 4 defaults (4px grid). Common rhythms:
- Card padding: `p-4` (cards), `p-6` (tier cards), `p-8` (recipe detail)
- Grid gap: `gap-4` (card grids), `gap-6` (feature grids), `gap-8` (page
  sections)
- Page container: `container mx-auto px-4 py-8`
- Detail pages: `max-w-4xl mx-auto`

**Radii:**
- `rounded-full` — taxonomy pills, status badges
- `rounded-lg` (8px) — buttons, inputs, nav rows
- `rounded-xl` (12px) — feature cards, tier cards, drawer panels

**Canonical card pattern:**
```
bg-[var(--theme-surface)]
border border-[var(--theme-border)]
rounded-lg
shadow-[var(--theme-shadow-sm)]
hover:shadow-[var(--theme-shadow-md)]
transition-shadow
```

---

## Motion

**Subtle, fast, no bounces.** Every transition in source is
`transition-colors`, `transition-shadow`, or `transition-transform` with
the default `ease`. No custom easing curves, no springs, no skeleton
shimmer, no entrance fades. The drawer animates with
`transition-transform duration-300 ease-in-out`. Hover lifts a card from
`shadow-sm` to `shadow-md`. That's the vocabulary — stay inside it.

---

## Backgrounds & imagery

**Solid first.** The one gradient in the codebase is a *very subtle* hero
wash on the public home (`bg-gradient-to-r from-cyan-500/10 via-blue-500/10
to-purple-500/10`) and the wordmark's `bg-clip-text` fill. **No patterns,
no textures, no food-photo overlays, no grain.**

Imagery enters the product only through user-uploaded recipe and cookbook
photos. There is no editorial illustration, no stock food photography, no
brand mascot, no decorative SVGs in the chrome. When an image is missing,
recipe cards fall back to a neutral `--theme-surface-hover` panel and
cookbook cards swap in a Lucide `BookOpen`.

**Don't generate decorative SVGs.** If a layout looks empty, fix it with
typography and composition, not invented illustrations.

---

## What "done" looks like

Before declaring a UI task complete:

- [ ] All four themes render legibly (`dark`, `dark-greens`, `light-cool`,
      `light-warm`). Toggle them in the header drawer to verify.
- [ ] No hard-coded hex values for theme-able colors.
- [ ] No emoji.
- [ ] Title Case on CTAs, Sentence case on body, brand name written `My
      CookBooks`.
- [ ] Lucide icons (not Heroicons, not inline SVG copies, not emoji).
- [ ] Hover states use `transition-colors` / `transition-shadow` /
      `transition-transform` only.
- [ ] Print styles still strip chrome (`@media print { header { display:
      none } }`) where relevant.
- [ ] If a new pattern emerged, the design system is updated to match.

---

## When in doubt

1. Open `design-system/components/index.html` and look at what the rest of
   the app does.
2. Check `src/components/` for an existing TypeScript implementation
   you can mirror.
3. If a pattern genuinely doesn't exist yet, add it to
   `design-system/components/` *and* `src/components/` in the same change
   so the system stays self-consistent.
