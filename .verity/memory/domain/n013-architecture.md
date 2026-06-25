---
schema: 1
id: n013-architecture
kind: domain
title: "Architecture"
confidence: 0.6
status: active
source: extractor
created_by: seed
created_at: 2026-06-25T22:59:01.286Z
updated_at: 2026-06-25T22:59:01.286Z
---

# Architecture

### Tech Stack
- **Framework:** TanStack Start with React 19, deployed via Nitro
- **Routing:** TanStack Router — file-based routing in `src/routes/`
- **Database:** MongoDB 7 (Docker or Atlas) with Mongoose ODM
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- **Icons:** Lucide React
- **Build:** Vite 8
- **Testing:** Vitest + React Testing Library (units) + Playwright (E2E)
- **TypeScript:** Strict mode with `noUnusedLocals` and `noUnusedParameters`

### Path Alias
`@/*` maps to `./src/*` (configured in tsconfig.json, resolved by Vite's native `resolve.tsconfigPaths`). Use `@/` imports, never relative paths.

### File-Based Routing
Routes in `src/routes/`, follow TanStack Router conventions:
- `__root.tsx` — root layout (Header + DevTools shell)
- `index.tsx` — page component for that directory's route
- `$param.tsx` — dynamic segment (e.g., `$recipeId.tsx` for `/recipes/:recipeId`)
- `$param.edit.tsx` — nested route (e.g., `/recipes/:recipeId/edit`)

Route tree auto-generated into `src/routeTree.gen.ts` — **never edit this file manually**.

### Route Component Pattern
Every route file exports `Route` object and named page function:
```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/path/')({ component: PageName })

function PageName() {
  return (/* JSX */)
}
```

### Component Organization
```
src/components/
├── Header.tsx              # Navigation header with mobile sidebar
├── layout/PageLayout.tsx   # Reusable page wrapper (title, description, children)
├── recipes/                # Recipe domain components
├── categories/             # Category domain components
└── ui/                     # Generic reusable UI components
```

Components use default exports and explicit props interfaces.

### Types
Shared TypeScript interfaces in `src/types/recipe.ts` (Recipe, Ingredient, Category, RecipeFilters). `difficulty` uses union type `'easy' | 'medium' | 'hard'`.

### Database
- **Model file

_Seeded from CLAUDE.md. Edit or archive if outdated._
