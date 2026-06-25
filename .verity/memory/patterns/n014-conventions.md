---
schema: 1
id: n014-conventions
kind: pattern
title: "Conventions"
confidence: 0.6
status: active
source: extractor
created_by: seed
created_at: 2026-06-25T22:59:01.286Z
updated_at: 2026-06-25T22:59:01.286Z
---

# Conventions

### Routing & Navigation
Use `<Link>` from `@tanstack/react-router`, never raw `<a>` tags. For typed params, use `Route.useParams()`.

### Styling
- Dark-first design, cyan accent (`cyan-400` through `cyan-600`)
- Dark backgrounds use `slate-800`/`slate-900` gradients
- Always include `dark:` variants on color properties
- Mobile-first responsive: `sm:`, `md:`, `lg:` breakpoints
- **Dark mode is class-based** (`@custom-variant dark` in `src/styles.css`). `.dark` applied statically to `<html>` in `src/routes/__root.tsx`. Don't use `prefers-color-scheme` — overridden by custom variant. When theme toggle built, manage class on `document.documentElement`, not media query.

### Vite Plugin Order
Plugin order in `vite.config.ts` matters: devtools → nitro → tailwindcss → tanstackStart → react.

_Seeded from CLAUDE.md. Edit or archive if outdated._
