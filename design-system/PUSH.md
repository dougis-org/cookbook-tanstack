# How to push this design-system folder to `cookbook-tanstack`

This folder is staged to land at `cookbook-tanstack/design-system/` and
referenced from the existing root `CLAUDE.md` via an `@` include (the same
pattern OpenWolf uses).

---

## 1. Drop the folder into the repo

```bash
# from your local clone of dougis-org/cookbook-tanstack
cd path/to/cookbook-tanstack
git checkout -b design-system
```

Then copy this `design-system/` folder to the repo root. From this project's
location:

```bash
# adjust paths to taste
cp -R /path/to/this/project/design-system path/to/cookbook-tanstack/
```

(Or download the zip from the chat and unzip it at the repo root.)

---

## 2. Add one block to the existing root `CLAUDE.md`

**Do not overwrite.** Open `cookbook-tanstack/CLAUDE.md` and paste the block
below immediately after the existing `# OpenWolf` section (it follows the
same `@`-include pattern, so it slots in cleanly):

```markdown
# Design System

@design-system/CLAUDE.md

When building or editing any user-facing surface — components, routes,
marketing pages, slides, emails — follow the rules in
`design-system/CLAUDE.md`. Tokens live in
`design-system/tokens/colors-and-type.css`; reference component
implementations live in `design-system/components/`. Don't hard-code
theme-able color values; don't add emoji; brand name is **My CookBooks**.
```

That's the entire CLAUDE.md change. The detailed rules live in
`design-system/CLAUDE.md` so the root file stays short.

---

## 3. Commit and push

```bash
cd path/to/cookbook-tanstack
git add design-system CLAUDE.md
git commit -m "Add design-system folder + agent guidance

- Stages tokens, components, and assets under design-system/
- Adds @design-system/CLAUDE.md include to root CLAUDE.md so agents
  pick up the brand rules automatically.
- No runtime changes; design-system/ is reference + docs only."

git push -u origin design-system
```

Then open a PR on GitHub.

---

## 4. (Optional) Update `AGENTS.md` / other agent manifests

The repo also has `AGENTS.md`, `.gemini/`, `.codex/`, `.qwen/`,
`.opencode/`, `.kiro/`, `.claude/`, and `.agent/` directories. If any of
those need their own design-system pointer, add a one-liner referencing
`design-system/CLAUDE.md`. The CLAUDE.md change above covers Claude Code
specifically.

---

## Notes on what's *not* included

- **Preview HTML cards** (`preview/badges.html`, `preview/tiers.html`, etc.
  from the design-system project) aren't copied here — they're review-pane
  artifacts and would just be clutter in the app repo. Say the word if you
  want them too.
- **Slide template** (`slides/index.html` from the design-system project)
  same — it's a marketing/deck artifact, not app code. Easy to add to
  `design-system/slides/` if useful.
- **JSX → TSX conversion:** the reference components in `components/` are
  plain JSX with hand-traced Lucide icons. The production app uses TSX +
  `lucide-react`. I left the JSX as-is because these are reference docs,
  not runtime code — but I can convert them to TSX that imports from
  `lucide-react` if you'd rather have a single source-of-truth set of
  components the runtime imports directly.
