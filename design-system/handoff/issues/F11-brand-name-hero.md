# F11 — Fix brand name on landing hero

## Context

`src/routes/index.tsx` hero currently renders the wordmark as **"CookBook"**:

```tsx
<span className="bg-gradient-to-r from-[var(--theme-accent)] to-blue-400 bg-clip-text text-transparent">
  CookBook
</span>
```

The canonical brand name is **My CookBooks** — capital C, capital B, joined. Documented in `design-system/CLAUDE.md` under "Brand name."

This is a 5-minute fix and should ship immediately, separate from the larger landing rewrite (F03).

## Acceptance criteria

- [ ] The hero wordmark reads "My CookBooks", not "CookBook".
- [ ] Both words inside the gradient `bg-clip-text` span: "My CookBooks" as a single string keeps the gradient unified across the whole brand name.
- [ ] Sizing/letter-spacing adjusted so the longer string fits the existing hero without wrapping at md/lg breakpoints. Likely needs `text-5xl md:text-6xl` instead of `text-6xl md:text-7xl`, or adjust `letter-spacing` from `-0.08em` to `-0.05em`.
- [ ] No other content changes — F03 is the broader rewrite.

## Where to start

- `src/routes/index.tsx` line ~52 (the `<span>` containing "CookBook")

## Constraints

- Theme tokens only.
- No emoji.

@claude please open a small PR — title it "fix: brand name on landing hero". This is the simplest possible change; merge fast.
