# Comment to add on #446 — design context for "My CookBooks" rename

> **How to use this**: open https://github.com/dougis-org/cookbook-tanstack/issues/446,
> click "Comment", paste this block, post. Then close #455 with a comment pointing here.

---

Design context from the May 2026 UX audit — supplements the existing scope.

## Brand name canonicalisation

The design system now treats **My CookBooks** as the canonical name — capital C, capital B, joined into one word. Rules documented in `design-system/CLAUDE.md`:

- **My CookBooks** — full name on first reference and in any lockup
- **My CookBooks** — chrome wordmark / header (just the name, no tagline)
- *Your Personal Recipe Management System* — the tagline (separate from the wordmark)

Never *My Cookbooks*, *Mycookbooks*, or *MyCookBooks*. The C and B are both capitalised.

## Where this appears in the codebase

- `src/routes/index.tsx` hero — currently renders "CookBook" inside the gradient `bg-clip-text` span. Change to "My CookBooks".
- `index.html` `<title>` tag and the favicon `<link>` references.
- `src/routes/__root.tsx` — anywhere the wordmark is rendered.
- `src/components/Header.tsx` — drawer header and brand mark area.
- All marketing copy, all email templates, all error pages, all auth screens.
- The `package.json` `name` and `description` fields if they say "cookbook".

## Sizing note

"My CookBooks" is wider than "CookBook" — at the existing hero `text-6xl md:text-7xl` with `letter-spacing: -0.08em` it may wrap awkwardly at the `md` breakpoint. Suggested adjustments:

- Drop one size: `text-5xl md:text-6xl`, OR
- Loosen letter-spacing: `letter-spacing: -0.05em` instead of `-0.08em`

Pick whichever keeps the wordmark on one line at all breakpoints. Don't break the gradient `bg-clip-text` fill — both words should be inside the single `<span>` so the gradient spans the whole name.

## Logo lockup

The design system has a primary lockup at `design-system/assets/logo-lockup.svg` (mark + "My CookBooks" wordmark in Fraunces) and a mark-only at `design-system/assets/logo-mark.svg` (currentColor for theming). Either is preferred over the inline `ChefHat` icon currently used in the hero.

---

**Closes #455** (which duplicated this issue — design context is now folded in here).
