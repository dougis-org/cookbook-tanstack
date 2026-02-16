# Code Quality Standards

## Test-Driven Development (TDD)

All code changes must follow strict Test-Driven Development with the RED → GREEN → REFACTOR cycle:

1. **RED:** Write failing tests first (never implement features before tests exist)
2. **GREEN:** Write minimal code to pass tests (no over-engineering)
3. **REFACTOR:** Improve code quality while keeping tests passing

### Applies to:
- New features (components, API routes, utilities)
- Bug fixes (write a test that reproduces the bug first)
- Refactoring (tests protect against regressions)

### Exception:
Architectural scaffolding (directory structure, configuration, build files) doesn't require tests, but all functional code does.

## Testing Strategy

### Unit & Integration Tests (Vitest + React Testing Library)

**When to write:**
- Business logic (utilities, hooks, calculations)
- Component rendering and state management
- Database operations (with mocked DB)
- API handlers
- Type guards and validation functions

**Test file location:** Co-locate with implementation
```
src/utils/recipe.ts → src/utils/recipe.test.ts
src/components/RecipeCard.tsx → src/components/RecipeCard.test.tsx
```

### End-to-End & UI Tests (Playwright)

**When to write:**
- All user interactions that touch the UI (form submissions, button clicks, navigation)
- Page flows and multi-step workflows
- Responsive behavior (mobile/tablet/desktop)
- Error states and edge cases
- Accessibility (keyboard navigation, screen reader compatibility)

**Critical Rule:** If code changes how users interact with the UI, it needs a Playwright test.

### Coverage Requirements

- **Vitest:** Minimum 80% coverage for business logic and utilities
- **Playwright:** All user-facing features must have E2E test coverage
- **Routes/Components:** If touched by a user, it needs a test

Check coverage:
```bash
npx vitest run --coverage
```

## Test-First Workflow for Features

When implementing a new feature, follow this workflow:

### Step 1: Write Vitest Tests (Business Logic - RED)
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

## Playwright Best Practices

### Selector Priority Order
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

### API Mocking
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

## Code Style & Standards

### TypeScript
- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`)
- No `any` types without justification
- Proper type narrowing and exhaustive checks
- Explicit props interfaces for components

### Imports
- Use path aliases (`@/*` → `./src/*`) instead of relative paths
- Group imports logically (external, internal, types)

### Naming Conventions
- Component files: PascalCase (`RecipeCard.tsx`)
- Utility/hook files: camelCase (`filterRecipes.ts`)
- Constants: UPPER_SNAKE_CASE
- Private functions: leadingUnderscore (optional)

## Code Review Principles

- Tests are required before merge
- Code quality issues found by analysis tools should be fixed before merge
- Refactoring for readability is encouraged
- Performance optimizations require benchmarks or profiling data
- All public APIs should have types and documentation

## Architecture Compliance

- Follow established patterns in CLAUDE.md and AGENTS.md
- Use path aliases consistently
- Component organization follows domain structure
- No circular dependencies
- Favor composition over inheritance in React components
