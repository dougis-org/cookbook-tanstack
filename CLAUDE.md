# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CookBook is a full-stack recipe management application being migrated from Laravel to TanStack Start. The database layer (PostgreSQL + Drizzle ORM) is in place with schema and seeds. The migration plan lives in `docs/plan/MIGRATION_PLAN.md` with detailed milestones in `docs/plan/milestones/`.

## Quick Setup

1. **Install dependencies:** `npm install`
2. **Start PostgreSQL:** `docker compose up -d` (starts PostgreSQL 16 with pgcrypto extension)
3. **Create environment file:** Copy `.env.example` to `.env.local` and adjust if needed
4. **Setup database:** `npm run db:push` then `npm run db:seed`
5. **Start dev server:** `npm run dev` — app runs on http://localhost:3000

## Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run test         # Run tests (vitest run)
npx vitest run src/path/to/file.test.ts  # Run a single test file

# Database commands (requires Docker: docker compose up -d)
npm run db:generate  # Generate migration SQL from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:push      # Push schema directly to DB (dev only, generates migration artifacts)
npm run db:studio    # Open Drizzle Studio to browse/edit data
npm run db:seed      # Seed taxonomy data (meals, courses, preparations) — idempotent
```

## Architecture

### Tech Stack
- **Framework:** TanStack Start with React 19, deployed via Nitro
- **Routing:** TanStack Router — file-based routing in `src/routes/`
- **Database:** PostgreSQL 16 (Docker) with Drizzle ORM
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- **Icons:** Lucide React
- **Build:** Vite 7
- **Testing:** Vitest + React Testing Library + jsdom
- **TypeScript:** Strict mode with `noUnusedLocals` and `noUnusedParameters`

### Path Alias
`@/*` maps to `./src/*` (configured in tsconfig.json, resolved by `vite-tsconfig-paths`). Always use `@/` imports instead of relative paths.

### File-Based Routing
Routes live in `src/routes/` and follow TanStack Router conventions:
- `__root.tsx` — root layout (Header + DevTools shell)
- `index.tsx` — page component for that directory's route
- `$param.tsx` — dynamic segment (e.g., `$recipeId.tsx` for `/recipes/:recipeId`)
- `$param.edit.tsx` — nested route (e.g., `/recipes/:recipeId/edit`)

The route tree is auto-generated into `src/routeTree.gen.ts` — **never edit this file manually**.

### Route Component Pattern
Every route file exports a `Route` object and a named page function:
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
Shared TypeScript interfaces live in `src/types/recipe.ts` (Recipe, Ingredient, Category, RecipeFilters). The `difficulty` field uses the union type `'easy' | 'medium' | 'hard'`.

### Database
- **Schema files:** `src/db/schema/` — one file per table, barrel-exported from `index.ts`
- **DB client:** `src/db/index.ts` — exports `db` singleton and `pool` instance with explicit `DATABASE_URL` validation
- **Migrations:** `drizzle/` — auto-generated SQL (committed to git). The initial migration enables `pgcrypto` extension for UUID generation.
- **Seeds:** `src/db/seeds/` — idempotent taxonomy seed scripts for meals, courses, preparations
- **Config:** `drizzle.config.ts` at project root with environment variable validation
- **15 tables:** users, recipes, classifications, sources, cookbooks, meals, courses, preparations, plus junction and social tables
- **Timestamp tracking:** All tables use `createdAt` (insert-only) and `updatedAt` (auto-updated via database trigger on every modification)
- **Environment:** Requires `DATABASE_URL` set in `.env.local` or `.env` (default: PostgreSQL on localhost using docker-compose credentials)
- See `docs/database.md` for full schema documentation

## Conventions

### Routing & Navigation
Always use `<Link>` from `@tanstack/react-router`, never raw `<a>` tags. For typed params, use `Route.useParams()`.

### Styling
- Dark-first design with cyan accent color (`cyan-400` through `cyan-600`)
- Dark backgrounds use `slate-800`/`slate-900` gradients
- Always include `dark:` variants on color properties
- Mobile-first responsive using `sm:`, `md:`, `lg:` breakpoints

### Vite Plugin Order
The plugin order in `vite.config.ts` matters: devtools → nitro → tsConfigPaths → tailwindcss → tanstackStart → react.

## Quality & Workflow

### TDD Enforcement
The project enforces a TDD workflow via agent specifications in `.github/agents/`: write failing tests first (RED), implement minimal code to pass (GREEN), then refactor.

### Security Scanning
GitHub instructions (`.github/instructions/`) configure Codacy and Snyk MCP integrations. Run security scans on new code when those tools are available.

### Markdown Linting
When editing `.md` files, use `fix_markdown` then `lint_markdown` tools if available (configured in `.github/instructions/markdown.instructions.md`).

## Planned Architecture (Not Yet Implemented)
Per the migration plan, future milestones will add: Better-Auth (authentication), tRPC (type-safe API), and Cloudinary/S3 (image storage).
