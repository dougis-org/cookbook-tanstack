# Contributing to CookBook

Welcome! This document provides a quick start for contributing to the CookBook project. For detailed guidance, see the comprehensive standards in `docs/standards/`.

## Quick Start

1. **Clone and setup:**
   ```bash
   git clone https://github.com/dougis-org/cookbook-tanstack.git
   cd cookbook-tanstack
   npm install
   docker compose up -d  # Start PostgreSQL
   npm run db:push && npm run db:seed
   npm run dev
   ```

2. **Read the standards** — Start with [docs/standards/README.md](./docs/standards/README.md)

3. **Follow TDD workflow** — RED → GREEN → REFACTOR (see [Code Quality](./docs/standards/code-quality.md))

## Key Standards

| Topic | Reference |
|-------|-----------|
| **Testing & TDD** | [Code Quality Standards](./docs/standards/code-quality.md) |
| **Code quality analysis** | [Analysis & Security Standards](./docs/standards/analysis-and-security.md) |
| **Tool errors & setup** | [Tooling Standards](./docs/standards/tooling.md) |
| **Merge readiness & CI/CD** | [CI/CD Workflow Standards](./docs/standards/ci-cd.md) |
| **Architecture patterns** | [AGENTS.md](./AGENTS.md) & [CLAUDE.md](./CLAUDE.md) |

## Development Commands

```bash
# Testing
npm run test              # Unit & integration tests (Vitest)
npm run test:e2e          # End-to-end tests (Playwright)
npx vitest run src/path/to/file.test.ts  # Single test file
npx playwright test --headed              # E2E with visible browser

# Database
npm run db:push           # Push schema to DB (dev only)
npm run db:seed           # Seed taxonomy data
npm run db:studio         # Open Drizzle Studio

# Build & Quality
npm run build             # Production build
npm run dev               # Development server
npx tsc --noEmit          # TypeScript type check

# Code Analysis (if tools available via MCP)
# See [Tooling Standards](./docs/standards/tooling.md) for details
```

## Before Creating a Pull Request

- [ ] **Tests pass:** `npm run test && npm run test:e2e`
- [ ] **TypeScript compiles:** `npx tsc --noEmit`
- [ ] **No unused variables/imports:** Check with TypeScript strict mode
- [ ] **Code follows patterns:** See [AGENTS.md](./AGENTS.md#architecture-guidelines)
- [ ] **TDD workflow followed:** Start with tests, implement, refactor

## Workflow Overview

### 1. Plan Your Work
Review the relevant standards in `docs/standards/` for your task type.

### 2. Write Tests First (RED)
- Unit/integration tests with Vitest
- E2E tests with Playwright for UI changes

### 3. Implement Code (GREEN)
- Write minimal code to pass tests
- No gold-plating or premature optimization

### 4. Refactor (REFACTOR)
- Improve readability and structure
- Keep all tests passing

### 5. Run Quality Checks
- **Tests:** `npm run test && npm run test:e2e`
- **TypeScript:** `npx tsc --noEmit`
- **Analysis:** Run Codacy/Snyk if available (see [Analysis Standards](./docs/standards/analysis-and-security.md))

### 6. Create Pull Request
- Leave a clear description of what changed and why
- Reference related issues if applicable
- Ensure all CI/CD checks can pass

## Testing Essentials

See [Code Quality Standards](./docs/standards/code-quality.md) for:
- When to write unit tests vs E2E tests
- Test file organization and naming
- Test structure templates
- Playwright best practices
- Coverage requirements (80% for utilities, 100% for user-facing features)

## Architecture & Conventions

- **Routing:** File-based routing in `src/routes/` (TanStack Router)
- **Components:** Domain-organized in `src/components/`
- **Imports:** Use `@/*` path aliases, never relative paths
- **Styling:** Tailwind CSS, dark-first, cyan accent color
- **Database:** PostgreSQL 16 with Drizzle ORM

See [AGENTS.md](./AGENTS.md#architecture-guidelines) and [CLAUDE.md](./CLAUDE.md) for full architecture details.

## Security & Code Quality

### Code Analysis (Optional but Recommended)
See [Analysis & Security Standards](./docs/standards/analysis-and-security.md):
- Run local Codacy analysis for code quality feedback (supplementary)
- Run Snyk scans after adding dependencies (security-critical)
- CI/CD runs authoritative checks on all PRs

### Tool Errors
See [Tooling Standards](./docs/standards/tooling.md#tool-unavailability--fallback-strategy):
- Tools are optional locally; CI/CD is authoritative
- If tools unavailable, proceed—CI/CD will validate before merge
- Gracefully handle MCP failures and tool errors

## Creating a Feature

Example: Adding recipe filtering

### Step 1: Write Vitest Tests
```typescript
// src/utils/filterRecipes.test.ts
describe('filterRecipes', () => {
  it('filters recipes by difficulty', () => {
    const recipes = [{ id: '1', difficulty: 'easy' }]
    const result = filterRecipes(recipes, { difficulty: 'easy' })
    expect(result).toHaveLength(1)
  })
})
```

### Step 2: Implement Minimal Code
```typescript
// src/utils/filterRecipes.ts
export function filterRecipes(recipes: Recipe[], filters: RecipeFilters) {
  if (!filters.difficulty) return recipes
  return recipes.filter(r => r.difficulty === filters.difficulty)
}
```

### Step 3: Write Playwright Tests
```typescript
// e2e/filtering.spec.ts
test('user can filter recipes by difficulty', async ({ page }) => {
  await page.goto('http://localhost:3000/recipes')
  await page.click('button:has-text("Difficulty")')
  await page.click('label:has-text("Easy")')
  const recipes = page.locator('[data-testid="recipe-card"]')
  await expect(recipes).toHaveCount(3)
})
```

### Step 4: Test & Refactor
```bash
npm run test && npm run test:e2e
npx tsc --noEmit
```

See [Code Quality Standards](./docs/standards/code-quality.md#test-first-workflow-for-features) for full examples.

## Getting Help

- **Standards questions:** See [docs/standards/README.md](./docs/standards/README.md)
- **Architecture questions:** See [AGENTS.md](./AGENTS.md) and [CLAUDE.md](./CLAUDE.md)
- **Database schema:** See [docs/database.md](./docs/database.md)
- **Project planning:** See [docs/plan/MIGRATION_PLAN.md](./docs/plan/MIGRATION_PLAN.md)
- **Tool issues:** See [Tooling Standards](./docs/standards/tooling.md#troubleshooting-guide)

## Tips for Success

✅ **Do:**
- Start with failing tests (RED phase)
- Keep commits focused on single features
- Review your own code first
- Test locally before pushing
- Ask questions in PR discussions

❌ **Don't:**
- Implement without tests
- Optimize prematurely
- Use `any` types without justification
- Merge without all tests passing
- Ignore CI/CD failures

## Questions?

- Check [docs/standards/README.md](./docs/standards/README.md) for standards index
- See [CONTRIBUTING-FAQ.md](./CONTRIBUTING-FAQ.md) if it exists
- Open a discussion or issue on GitHub
