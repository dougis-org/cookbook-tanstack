# AGENTS.md

Agent specifications for working with the CookBook repository. This file enforces testing practices and development workflow for all code contributions.

## TDD Workflow (RED → GREEN → REFACTOR)

**All code changes must follow strict Test-Driven Development:**

1. **RED:** Write failing tests first (never implement features before tests exist)
2. **GREEN:** Write minimal code to pass tests (no over-engineering)
3. **REFACTOR:** Improve code quality while keeping tests passing

**This applies to:**
- New features (component implementations, API routes, utilities)
- Bug fixes (write a test that reproduces the bug first)
- Refactoring (tests protect against regressions)

**Exception:** Architectural scaffolding (directory structure, tsconfig, vite plugins) doesn't require tests, but all functional code does.

---

## Testing Strategy

### Unit & Integration Tests (Vitest + React Testing Library)

**When to write Vitest tests:**
- Business logic (utilities, hooks, calculations)
- Component rendering and state management
- Database operations (with mocked DB)
- API handlers
- Type guards and validation functions

**Test file location:** Co-locate with implementation file
```
src/utils/recipe.ts
src/utils/recipe.test.ts

src/components/RecipeCard.tsx
src/components/RecipeCard.test.tsx

src/routes/recipes/index.tsx
src/routes/recipes/index.test.tsx
```

**Running tests:**
```bash
npm run test                                    # All tests
npx vitest run src/path/to/file.test.ts        # Single file
npx vitest watch src/path/to/file.test.ts      # Watch mode
```

### E2E + UI Tests (Playwright)

**When to write Playwright tests:**
- **All user interactions** that touch the UI: form submissions, button clicks, navigation, filtering, sorting
- **Page flows:** Multi-step workflows (create recipe → view → edit → delete)
- **Responsive behavior:** Mobile/tablet/desktop interactions
- **Error states:** Invalid form inputs, network failures, edge cases
- **Accessibility:** Keyboard navigation, screen reader compatibility

**Critical:** If code changes how users interact with the UI, it needs a Playwright test.

**Test file location:**
```
e2e/
├── recipes.spec.ts           # Recipe CRUD and interactions
├── filtering.spec.ts         # Recipe filtering and search
├── navigation.spec.ts        # Page navigation and header
├── responsive.spec.ts        # Mobile/tablet/desktop views
└── auth.spec.ts              # Authentication flows (once implemented)
```

**Running tests:**
```bash
npm run test:e2e                      # All E2E tests
npm run test:e2e -- recipes.spec.ts   # Single E2E file
npx playwright test --headed          # Run with browser visible
npx playwright test --debug           # Run in debug mode
```

### Test Structure Template

**Vitest (unit/integration):**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { recipeToRecipeDTO } from '@/utils/recipe'

describe('recipeToRecipeDTO', () => {
  it('converts a database recipe to a DTO', () => {
    const recipe = { id: '1', title: 'Pasta', difficulty: 'easy' as const }
    const dto = recipeToRecipeDTO(recipe)
    expect(dto.title).toBe('Pasta')
    expect(dto.difficulty).toBe('easy')
  })

  it('handles missing optional fields', () => {
    const recipe = { id: '1', title: 'Soup', difficulty: undefined }
    expect(() => recipeToRecipeDTO(recipe)).not.toThrow()
  })
})
```

**Playwright (E2E/UI):**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Recipe CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/recipes')
  })

  test('user can create a new recipe', async ({ page }) => {
    // 1. Click "New Recipe" button
    await page.click('button:has-text("New Recipe")')

    // 2. Fill form fields
    await page.fill('input[name="title"]', 'Spaghetti Carbonara')
    await page.selectOption('select[name="difficulty"]', 'medium')

    // 3. Submit form
    await page.click('button[type="submit"]')

    // 4. Assert success state
    await expect(page.locator('text=Recipe created successfully')).toBeVisible()
    await expect(page).toHaveURL(/\/recipes\/[\w-]+$/)
  })

  test('displays validation errors for invalid input', async ({ page }) => {
    await page.click('button:has-text("New Recipe")')
    await page.click('button[type="submit"]')

    // Title is required
    await expect(page.locator('text=Title is required')).toBeVisible()
  })

  test('user can edit an existing recipe', async ({ page }) => {
    // Navigate to a specific recipe
    await page.goto('http://localhost:3000/recipes/existing-recipe-id')
    await page.click('button:has-text("Edit")')

    // Change fields
    const titleField = page.locator('input[name="title"]')
    await titleField.clear()
    await titleField.fill('Updated Title')

    await page.click('button[type="submit"]')
    await expect(page.locator('text=Recipe updated successfully')).toBeVisible()
  })

  test('user can delete a recipe with confirmation', async ({ page }) => {
    await page.goto('http://localhost:3000/recipes/existing-recipe-id')

    // Trigger delete
    await page.click('button:has-text("Delete")')

    // Confirm in modal
    await page.click('button:has-text("Confirm Delete")')

    // Assert redirect to recipes list
    await expect(page).toHaveURL('http://localhost:3000/recipes')
  })
})
```

---

## Test-First Workflow for Features

When implementing a new feature (e.g., "Add recipe filtering"):

### Step 1: Write Vitest Tests (Business Logic)
```typescript
// src/utils/filterRecipes.test.ts
describe('filterRecipes', () => {
  it('filters recipes by difficulty', () => {
    const recipes = [
      { id: '1', difficulty: 'easy' },
      { id: '2', difficulty: 'hard' },
    ]
    const result = filterRecipes(recipes, { difficulty: 'easy' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('returns all recipes when no filters applied', () => {
    const recipes = [/* ... */]
    const result = filterRecipes(recipes, {})
    expect(result).toEqual(recipes)
  })
})
```

### Step 2: Implement Minimal Code (GREEN)
```typescript
// src/utils/filterRecipes.ts
export function filterRecipes(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
  if (!filters.difficulty) return recipes
  return recipes.filter(r => r.difficulty === filters.difficulty)
}
```

### Step 3: Write Playwright Tests (UI Integration)
```typescript
// e2e/filtering.spec.ts
test('user can filter recipes by difficulty', async ({ page }) => {
  await page.goto('http://localhost:3000/recipes')

  // Click filter button and select "Easy"
  await page.click('button:has-text("Difficulty")')
  await page.click('label:has-text("Easy")')

  // Assert only easy recipes shown
  const recipes = page.locator('[data-testid="recipe-card"]')
  await expect(recipes).toHaveCount(3) // Your test data has 3 easy recipes

  // Verify recipe content
  await expect(page.locator('text="Easy Pasta"')).toBeVisible()
})
```

### Step 4: Refactor (Code Quality)
Once tests pass, improve code readability, performance, or structure without breaking tests.

---

## Playwright Best Practices

### Selectors (Priority Order)
1. **Data attributes** (most stable): `page.locator('[data-testid="recipe-card"]')`
2. **Accessible selectors**: `page.getByRole('button', { name: 'Save' })`
3. **Text matchers**: `page.locator('text=Recipe Title')`
4. **CSS/XPath** (least stable): `page.locator('div.recipe-card')`

### Test Data
- Seed the database with known test data in `beforeEach` hooks
- Use fixtures to reset state between tests
- Never rely on test execution order

### Async/Wait Patterns
```typescript
// Good: Wait for element to be visible
await expect(page.locator('text=Success')).toBeVisible()

// Good: Use page navigation waits
await page.goto('http://localhost:3000/recipes')

// Avoid: Hard-coded sleeps
// ❌ await page.waitForTimeout(1000)
```

### API Mocking (if needed)
```typescript
test('handles API errors gracefully', async ({ page }) => {
  // Mock failed API response
  await page.route('**/api/recipes', route => {
    route.abort('failed')
  })

  await page.goto('http://localhost:3000/recipes')
  await expect(page.locator('text=Failed to load recipes')).toBeVisible()
})
```

---

## Coverage Requirements

- **Vitest:** Minimum 80% coverage for business logic and utilities
- **Playwright:** All user-facing features must have E2E test coverage
- **Routes/Components:** If touched by a user, it needs a test

**Check coverage:**
```bash
npx vitest run --coverage
```

---

## Architecture Guidelines (from CLAUDE.md)

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

## Security & Quality

### Security Scanning
GitHub instructions (`.github/instructions/`) configure Codacy and Snyk MCP integrations. Run security scans on new code when those tools are available.

### TypeScript Strictness
- Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- No `any` types without justification
- Proper type narrowing and exhaustive checks

### Markdown Linting
When editing `.md` files, use `fix_markdown` then `lint_markdown` tools if available (configured in `.github/instructions/markdown.instructions.md`).

---

## Implementation Checklist

When implementing a feature:
- [ ] Write failing Vitest tests (RED)
- [ ] Implement minimal code to pass (GREEN)
- [ ] Write Playwright E2E tests for UI interactions
- [ ] Refactor for clarity and maintainability
- [ ] Run all tests: `npm run test && npm run test:e2e`
- [ ] Run security scans if tools available
- [ ] Verify TypeScript compliance: `npx tsc --noEmit`
- [ ] Check no unused imports/variables

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
