# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.

# Design System

@design-system/CLAUDE.md

When building or editing any user-facing surface — components, routes,
marketing pages, slides, emails — follow the rules in
`design-system/CLAUDE.md`. Tokens live in
`design-system/tokens/colors-and-type.css`; reference component
implementations live in `design-system/components/`. Don't hard-code
theme-able color values; don't add emoji; brand name is **My CookBooks**.

# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working with CookBook repository.

**🔬 For testing requirements and TDD workflow, see [AGENTS.md](./AGENTS.md).**

## Project Overview

CookBook = full-stack recipe management app in TanStack Start.

## Quick Setup

1. **Install dependencies:** `npm install`
2. **Start MongoDB:** `docker compose up -d` (starts MongoDB 7)
3. **Create environment file:** Copy `.env.example` to `.env.local`, adjust if needed
4. **Seed database:** `npm run db:seed`
5. **Start dev server:** `npm run dev` — app runs on http://localhost:3000

## Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build

# Testing (see AGENTS.md for detailed testing strategy)
npm run test         # Run unit & integration tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
npx vitest run src/path/to/file.test.ts     # Run single Vitest file
npx playwright test --headed                 # Run E2E tests with browser visible

# Database commands (requires Docker: docker compose up -d, or set MONGODB_URI to Atlas)
npm run db:connect   # Verify MongoDB connection is reachable
npm run db:seed      # Seed taxonomy data (meals, courses, preparations) — idempotent
```

## Architecture

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
- **Model files:** `src/db/models/` — one Mongoose model per collection, barrel-exported from `index.ts`
- **DB client:** `src/db/index.ts` — Mongoose connection singleton, global strict mode; reads `MONGODB_URI`, throws if missing; exports `getMongoClient()` for Better-Auth
- **Seeds:** `src/db/seeds/` — idempotent taxonomy seed scripts (upsert by slug) for meals, courses, preparations
- **Collections:** users, sessions, accounts, verifications (Better-Auth), recipes, classifications, sources, cookbooks, meals, courses, preparations, recipe-likes
- **Document design:** Recipes embed taxonomy as ObjectId arrays (`mealIds`, `courseIds`, `preparationIds`); Cookbooks embed recipe entries (`{ recipeId, orderIndex }`); RecipeLike is separate collection
- **Timestamp tracking:** All models use Mongoose `timestamps: true` (auto-managed `createdAt` / `updatedAt`)
- **Environment:** Requires `MONGODB_URI` in `.env.local` or `.env`. Default: `mongodb://localhost:27017/cookbook` (Docker). Override with Atlas SRV string for off-network / shared dev.
- See `docs/database.md` for full collection docs

## Conventions

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

## Development Workflow

**Testing & TDD:** All code changes follow TDD (write tests first). See [AGENTS.md](./AGENTS.md) for full testing strategy:
- Vitest + React Testing Library for unit/integration tests
- Playwright for E2E and UI interaction tests
- Test coverage requirements and best practices

**Security:** GitHub instructions (`.github/instructions/`) configure Codacy and Snyk MCP integrations. Run security scans on new code when tools available.

**Markdown:** When editing `.md` files, use `fix_markdown` then `lint_markdown` tools if available.

**Pull Requests & Auto-Merge:** Enable auto-merge on PRs — merges once quality gates pass and comments addressed. See [CI/CD Workflow Standards](./docs/standards/ci-cd.md).

## Completed additions

Better-Auth (authentication), tRPC (type-safe API)
