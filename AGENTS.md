# AGENTS.md

Agent and contributor specifications for working with the CookBook repository.

## Repository Standards

All development work must follow the repository-wide standards. See **[docs/standards/](./docs/standards/)** for comprehensive guidelines:

- **[Code Quality](./docs/standards/code-quality.md)** — TDD workflow (RED → GREEN → REFACTOR), testing strategy, coverage requirements, test-first workflow examples
- **[Analysis & Security](./docs/standards/analysis-and-security.md)** — When to run code analysis, security scanning, remediation workflow
- **[Tooling](./docs/standards/tooling.md)** — Working with analysis tools, error handling, graceful fallbacks
- **[CI/CD Workflow](./docs/standards/ci-cd.md)** — Local vs CI/CD validation, merge readiness

Use [CONTRIBUTING.md](./CONTRIBUTING.md) as a quick reference for getting started.

---

## Architecture Guidelines

Agents working with this codebase should follow these architectural patterns:

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

### Conventions

**Routing & Navigation:**
Always use `<Link>` from `@tanstack/react-router`, never raw `<a>` tags. For typed params, use `Route.useParams()`.

**Styling:**
- Dark-first design with cyan accent color (`cyan-400` through `cyan-600`)
- Dark backgrounds use `slate-800`/`slate-900` gradients
- Always include `dark:` variants on color properties
- Mobile-first responsive using `sm:`, `md:`, `lg:` breakpoints

**Path Aliases:**
`@/*` maps to `./src/*` (configured in tsconfig.json). Always use `@/` imports instead of relative paths.

**Vite Plugin Order:**
The plugin order in `vite.config.ts` matters: devtools → nitro → tsConfigPaths → tailwindcss → tanstackStart → react.

---

## Code Quality & Security

### TypeScript Strictness
- Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- No `any` types without justification
- Proper type narrowing and exhaustive checks

### Security & Code Analysis
See [Analysis & Security Standards](./docs/standards/analysis-and-security.md) for:
- When to run code analysis (Codacy)
- Security scanning (Snyk)
- Vulnerability remediation workflow

Tool-specific configurations are in `.github/instructions/`:
- [Codacy integration](./github/instructions/codacy.instructions.md)
- [Snyk integration](./github/instructions/snyk_rules.instructions.md)

### Markdown Quality
When editing `.md` files:
1. Run `fix_markdown` tool on the file
2. Run `lint_markdown` to check for issues
3. Fix remaining issues (see [Tooling Standards](./docs/standards/tooling.md) if tools unavailable)

---

## Implementation Workflow

When implementing a feature, follow this checklist:

1. **Start with tests (RED phase)**
   - [ ] Write failing Vitest tests for business logic
   - [ ] Write Playwright tests for UI interactions

2. **Implement code (GREEN phase)**
   - [ ] Write minimal code to pass tests
   - [ ] Co-locate test files with implementation

3. **Quality checks (REFACTOR phase)**
   - [ ] Improve code readability and structure
   - [ ] Keep all tests passing
   - [ ] Run all tests: `npm run test && npm run test:e2e`
   - [ ] Verify TypeScript: `npx tsc --noEmit`
   - [ ] Check for unused imports/variables

4. **Security & Analysis**
   - [ ] Run Codacy analysis if available (see [Analysis Standards](./docs/standards/analysis-and-security.md))
   - [ ] Run Snyk scan if new dependencies added
   - [ ] Fix critical/high severity issues before merge

5. **Create pull request**
   - [ ] All tests pass locally
   - [ ] TypeScript compilation succeeds
   - [ ] Local quality gates met (ready for CI/CD validation)
   - [ ] **Enable auto-merge** immediately when PR is created
   - [ ] CI/CD will validate quality gates before merge
   - [ ] Address all PR comments and feedback
   - [ ] PR will merge automatically when all checks pass and comments are resolved

See [CONTRIBUTING.md](./CONTRIBUTING.md) for a quick reference.

---

## Tech Stack Reference

- **Framework:** TanStack Start with React 19, deployed via Nitro
- **Routing:** TanStack Router — file-based routing in `src/routes/`
- **Database:** PostgreSQL 16 (Docker) with Drizzle ORM
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- **Icons:** Lucide React
- **Build:** Vite 7
- **Testing:** Vitest + React Testing Library (units) + Playwright (E2E)
- **TypeScript:** Strict mode with `noUnusedLocals` and `noUnusedParameters`
