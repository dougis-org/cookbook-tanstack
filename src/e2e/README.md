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

- `registration.spec.ts` — User registration flow, validation, and error handling

Each test file covers:
- ✅ Happy path scenarios
- ✅ Validation errors
- ✅ Edge cases (duplicates, invalid input)
- ✅ Loading states
- ✅ Navigation

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
- ✅ Display form elements
- ✅ Successful registration with valid data
- ✅ Validation: empty username
- ✅ Validation: invalid email
- ✅ Validation: short password
- ✅ Loading state during submission
- ✅ Navigation to login page
- ✅ Duplicate username prevention
- ✅ Duplicate email prevention

## Future Test Coverage

Planned E2E test suites:
- Authentication flow (login, logout)
- Recipe CRUD operations
- Search and filtering
- Cookbook management
- User profile management
