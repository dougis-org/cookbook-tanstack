# E2E Testing with Playwright

This directory contains end-to-end tests for CookBook using [Playwright](https://playwright.dev).

## Setup

### Install Browsers

Playwright requires browser binaries to be installed. Run:

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit. On Linux, you may need additional system dependencies:

```bash
npx playwright install-deps
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in headed mode (see the browser)
```bash
npx playwright test --headed
```

### Run a specific test file
```bash
npx playwright test src/e2e/registration.spec.ts
```

### Run tests in debug mode (step through with inspector)
```bash
npm run test:e2e:debug
```

### Run tests with UI (visual test runner)
```bash
npm run test:e2e:ui
```

## Test Structure

Tests are organized by feature:

- `registration.spec.ts` — User registration form UI and validation
- `recipes-crud.spec.ts` — Recipe create, edit, and delete operations
- `recipes-list.spec.ts` — Recipe list search, sort, filter, and pagination
- `recipes-auth.spec.ts` — Auth-gated actions (create/edit/delete visibility)
- `recipes-favorites.spec.ts` — Mark/unmark recipes as favorites
- `helpers/auth.ts` — Reusable registration and login helpers
- `helpers/recipes.ts` — Recipe form submission helper

## Viewing Test Results

After running tests, an HTML report is generated:

```bash
npx playwright show-report
```

This opens an interactive report showing:
- Test results (passed/failed)
- Screenshots and videos (on failure)
- Trace files for debugging

## CI/CD Integration

The configuration in `playwright.config.ts` automatically:
- Starts the dev server before tests
- Runs tests in headless mode in CI
- Retries failed tests twice in CI
- Uses a single worker in CI (sequential execution)

## Debugging Tips

1. **Pause on failure**: Playwright automatically captures screenshots and traces
2. **Step through code**: Use `await page.pause()` in tests to pause execution
3. **See browser actions**: Use `--headed` flag to watch the browser
4. **Inspect elements**: Use `await page.locator('selector').inspect()` to pause on elements
5. **Check network**: Use `--shm-size=2gb` if tests fail with memory errors on GitHub Actions

## Test Coverage

Current E2E tests cover:

### Registration (`registration.spec.ts`)
- ✅ Display form elements and accessible labels
- ✅ Fill form with valid data
- ✅ Input types, placeholders, required field indicators
- ✅ Submit button state
- ✅ Navigation to login page

### Recipe CRUD (`recipes-crud.spec.ts`)
- ✅ Create recipe with all fields (name, notes, times, servings, difficulty, ingredients, instructions, nutrition)
- ✅ Edit an existing recipe and verify changes persist
- ✅ Delete recipe via confirmation modal

### Recipe List (`recipes-list.spec.ts`)
- ✅ Search recipes by name with debounced URL update
- ✅ Show "No recipes found" for unmatched search
- ✅ Change sort order (newest, oldest, name A-Z, name Z-A)
- ✅ Filter by taxonomy chips and toggle active state
- ✅ Clear all active filters
- ✅ Display pagination controls when enough recipes exist

### Auth-Gated Actions (`recipes-auth.spec.ts`)
- ✅ Redirect unauthenticated user from /recipes/new to login
- ✅ Redirect unauthenticated user from /recipes/:id/edit to login
- ✅ Hide "New Recipe" button on list page when logged out
- ✅ Show "New Recipe" button on list page when logged in
- ✅ Hide Edit/Delete buttons for unauthenticated users
- ✅ Hide Edit/Delete buttons for non-owner users
- ✅ Show Edit/Delete buttons for recipe owner

### Favorites (`recipes-favorites.spec.ts`)
- ✅ Toggle favorite on and off (Save/Saved button)
- ✅ Hide Save button when logged out

## Future Test Coverage

Planned E2E test suites:
- Authentication flow (login, logout, session persistence)
- Cookbook management
- User profile management
