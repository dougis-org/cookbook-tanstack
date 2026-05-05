# AGENTS.md

Agent + contributor specs for CookBook repo.

## Repository Standards

All dev work follow repo-wide standards. See **[docs/standards/](./docs/standards/)**:

- **[Code Quality](./docs/standards/code-quality.md)** — TDD (RED → GREEN → REFACTOR), testing strategy, coverage, test-first examples
- **[Analysis & Security](./docs/standards/analysis-and-security.md)** — When run analysis, security scanning, remediation
- **[Tooling](./docs/standards/tooling.md)** — Analysis tools, error handling, graceful fallbacks
- **[CI/CD Workflow](./docs/standards/ci-cd.md)** — Local vs CI/CD validation, merge readiness

Use [CONTRIBUTING.md](./CONTRIBUTING.md) quick-start reference.

## PRs and merge

You must **NEVER** bypass PR gates and force merge.
ALL comments must be addressed and once addressed they must also be resolved to allow auto merge to happen

## Architecture Guidelines

Follow these patterns:

### File-Based Routing
Routes in `src/routes/`, follow TanStack Router conventions:
- `__root.tsx` — root layout (Header + DevTools shell)
- `index.tsx` — page component for directory route
- `$param.tsx` — dynamic segment (e.g., `$recipeId.tsx` for `/recipes/:recipeId`)
- `$param.edit.tsx` — nested route (e.g., `/recipes/:recipeId/edit`)

Route tree auto-generated into `src/routeTree.gen.ts` — **never edit manually**.

### Route Component Pattern
Every route file exports `Route` object + named page function:
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

Components use default exports + explicit props interfaces.

### Database & API Patterns

**MongoDB/Mongoose:**
- Models in `src/db/models/`, barrel-exported from `index.ts`
- All models use Mongoose `timestamps: true` (auto-managed `createdAt`/`updatedAt`)
- Mongoose strict mode globally enabled in `src/db/index.ts`
- Taxonomy (meals, courses, preparations) embedded as ObjectId arrays in recipes
- Seeds idempotent (upsert by slug), live in `src/db/seeds/`
- DB connection reads `MONGODB_URI` from `.env.local`; throws if missing

**tRPC & Type-Safe API:**
- Server procedures in `src/server/trpc/routers/` (one file per domain, e.g., `recipes.ts`)
- Import procedures into `src/server/trpc/router.ts`, merge into root router
- Client queries via tRPC context in `src/server/trpc/context.ts`
- Auto type inference server→client. No manual typing needed.

**Authentication (Better-Auth):**
- Sessions stored in MongoDB (collections: `user`, `session`, `account`, `verification`)
- Retrieved via `getMongoClient()` + `getBetterAuthCollection()` from `src/db/index.ts`
- Use Better-Auth client in route components to check auth status + user info

**Database Commands:**
```bash
npm run db:connect   # Verify MongoDB connection is reachable
npm run db:seed      # Seed taxonomy data (idempotent, safe to run multiple times)
```

### Conventions

**Routing & Navigation:**
Always use `<Link>` from `@tanstack/react-router`, never raw `<a>` tags. Typed params: use `Route.useParams()`.

**Styling:**
- Dark-first, cyan accent (`cyan-400` through `cyan-600`)
- Dark backgrounds: `slate-800`/`slate-900` gradients
- Always include `dark:` variants on color properties
- Mobile-first responsive: `sm:`, `md:`, `lg:` breakpoints
- Dark mode class-based (`@custom-variant dark` in `src/styles.css`); `.dark` applied to `<html>` in `src/routes/__root.tsx`

**Path Aliases:**
`@/*` maps to `./src/*` (tsconfig.json). Always use `@/` over relative paths.

**Vite Plugin Order:**
Order in `vite.config.ts` matters: devtools → nitro → tsConfigPaths → tailwindcss → tanstackStart → react.

---

## Code Quality & Security

### TypeScript Strictness
- Strict mode with `noUnusedLocals` + `noUnusedParameters`
- No `any` without justification
- Proper type narrowing + exhaustive checks

### Security & Code Analysis
See [Analysis & Security Standards](./docs/standards/analysis-and-security.md) for:
- When run Codacy analysis
- Snyk security scanning
- Vulnerability remediation

Tool configs in `.github/instructions/`:
- [Codacy integration](./github/instructions/codacy.instructions.md)
- [Snyk integration](./github/instructions/snyk_rules.instructions.md)

### Markdown Quality
When editing `.md` files:
1. Run `fix_markdown` on file
2. Run `lint_markdown` check
3. Fix remaining (see [Tooling Standards](./docs/standards/tooling.md) if tools unavailable)

---

## Implementation Workflow

Feature checklist:

1. **Start with tests (RED phase)**
   - [ ] Write failing Vitest tests for business logic
   - [ ] Write Playwright tests for UI interactions

2. **Implement code (GREEN phase)**
   - [ ] Write minimal code to pass tests
   - [ ] Co-locate test files with implementation

3. **Quality checks (REFACTOR phase)**
   - [ ] Improve readability + structure
   - [ ] Keep all tests passing
   - [ ] Run all tests: `npm run test && npm run test:e2e`
   - [ ] Verify TypeScript: `npx tsc --noEmit`
   - [ ] Check unused imports/variables

4. **Security & Analysis**
   - [ ] Run Codacy if available (see [Analysis Standards](./docs/standards/analysis-and-security.md))
   - [ ] Run Snyk if new dependencies added
   - [ ] Fix critical/high severity before merge

5. **Create pull request**
   - [ ] All tests pass locally
   - [ ] TypeScript compilation succeeds
   - [ ] Local quality gates met
   - [ ] **Enable auto-merge** immediately on PR create
   - [ ] CI/CD validates quality gates before merge
   - [ ] Address all PR comments
   - [ ] PR merges automatically when checks pass + comments resolved

See [CONTRIBUTING.md](./CONTRIBUTING.md) quick reference.

---

## Tech Stack Reference

- **Framework:** TanStack Start with React 19, deployed via Nitro
- **Routing:** TanStack Router — file-based in `src/routes/`
- **Database:** MongoDB 7 (Docker or Atlas) with Mongoose ODM
- **API Layer:** tRPC (type-safe RPC) with `@trpc/server` and `@trpc/tanstack-react-query`
- **Authentication:** Better-Auth (Nitro-based sessions, stored in MongoDB)
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- **Icons:** Lucide React
- **Build:** Vite 7
- **Testing:** Vitest + React Testing Library (units) + Playwright (E2E)
- **TypeScript:** Strict mode with `noUnusedLocals` and `noUnusedParameters`