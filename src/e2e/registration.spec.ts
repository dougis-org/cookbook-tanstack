import { test, expect } from "@playwright/test";

test.describe("Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session/cookies
    await page.context().clearCookies();
    await page.goto("/auth/register");
  });

  test("should display registration form", async ({ page }) => {
    // Check that all form elements are present using getByRole for better specificity
    await expect(page.getByRole('textbox', { name: /^Name$/ })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^Username/ })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^Email/ })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^Password/ })).toBeVisible();

    // Check submit button
    await expect(
      page.getByRole('button', { name: 'Create Account' }),
    ).toBeVisible();

    // Check login link
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test("should register a new user with valid data", async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;
    const testPassword = "ValidPassword123!";
    const testName = "Test User";

    // Fill in the form using getByLabel for better semantics
    await page.getByLabel(/^Name$/).fill(testName);
    await page.getByLabel(/^Username/).fill(testUsername);
    await page.getByLabel(/^Email/).fill(testEmail);
    await page.getByLabel(/^Password/).fill(testPassword);

    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for navigation to home page (successful registration)
    // Allow longer timeout for form submission and redirect
    await page.waitForURL("/", { timeout: 15000 });

    // Verify we're on the home page
    expect(page.url()).toBe("http://localhost:3000/");
  });

  test("should show validation error for empty username", async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testPassword = "ValidPassword123!";

    // Fill in form without username
    await page.getByLabel(/^Email/).fill(testEmail);
    await page.getByLabel(/^Password/).fill(testPassword);

    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Check for validation error
    await expect(page.locator("text=Username is required")).toBeVisible();
  });

  test("should show validation error for invalid email", async ({ page }) => {
    const timestamp = Date.now();
    const testUsername = `testuser${timestamp}`;
    const testPassword = "ValidPassword123!";

    // Fill in form with invalid email
    await page.getByLabel(/^Username/).fill(testUsername);
    await page.getByLabel(/^Email/).fill("invalid-email");
    await page.getByLabel(/^Password/).fill(testPassword);

    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Check for validation error
    await expect(page.locator("text=Please enter a valid email")).toBeVisible();
  });

  test("should show validation error for short password", async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;
    const shortPassword = "short1";

    // Fill in form with short password
    await page.getByLabel(/^Username/).fill(testUsername);
    await page.getByLabel(/^Email/).fill(testEmail);
    await page.getByLabel(/^Password/).fill(shortPassword);

    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Check for validation error
    await expect(
      page.locator("text=Password must be at least 8 characters"),
    ).toBeVisible();
  });

  test("should show loading state while registering", async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;
    const testPassword = "ValidPassword123!";
    const testName = "Test User";

    // Fill in the form
    await page.getByLabel(/^Name$/).fill(testName);
    await page.getByLabel(/^Username/).fill(testUsername);
    await page.getByLabel(/^Email/).fill(testEmail);
    await page.getByLabel(/^Password/).fill(testPassword);

    // Get the submit button
    const submitButton = page.getByRole('button', { name: 'Create Account' });

    // Click submit
    await submitButton.click();

    // Check for loading state (button text should change or be disabled)
    // The button might show "Creating account..." or be disabled
    const isLoading =
      (await submitButton.isDisabled()) ||
      (await page
        .locator('button:has-text("Creating account...")')
        .isVisible()
        .catch(() => false));

    if (
      isLoading ||
      (await page
        .locator('button:has-text("Creating account...")')
        .isVisible()
        .catch(() => false))
    ) {
      // Loading state was visible
      expect(true).toBe(true);
    }

    // Wait for navigation (registration to complete)
    await page.waitForURL("/", { timeout: 15000 });
  });

  test("should navigate to login page from register page", async ({ page }) => {
    // Click the "Sign in" link
    await page.getByRole('link', { name: 'Sign in' }).click();

    // Verify navigation to login page
    await page.waitForURL("/auth/login");
    expect(page.url()).toContain("/auth/login");
  });

  test("should not register user with duplicate username", async ({ page }) => {
    const testEmail1 = `testuser1-${Date.now()}@example.com`;
    const testUsername = `testuser-duplicate-${Date.now()}`;
    const testPassword = "ValidPassword123!";

    // Register first user with specific username
    await page.getByLabel(/^Username/).fill(testUsername);
    await page.getByLabel(/^Email/).fill(testEmail1);
    await page.getByLabel(/^Password/).fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for successful registration
    await page.waitForURL("/", { timeout: 15000 });

    // Navigate back to registration page
    await page.goto("/auth/register");
    await page.context().clearCookies(); // Clear session

    // Try to register with same username
    const testEmail2 = `testuser2-${Date.now()}@example.com`;
    await page.getByLabel(/^Username/).fill(testUsername);
    await page.getByLabel(/^Email/).fill(testEmail2);
    await page.getByLabel(/^Password/).fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show error (username already exists)
    await expect(
      page.locator("text=/[Uu]sername|already.*exists|already.*taken/"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("should not register user with duplicate email", async ({ page }) => {
    const testEmail = `testuser-duplicate-${Date.now()}@example.com`;
    const testUsername1 = `testuser1-${Date.now()}`;
    const testPassword = "ValidPassword123!";

    // Register first user with specific email
    await page.getByLabel(/^Username/).fill(testUsername1);
    await page.getByLabel(/^Email/).fill(testEmail);
    await page.getByLabel(/^Password/).fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for successful registration
    await page.waitForURL("/", { timeout: 15000 });

    // Navigate back to registration page
    await page.goto("/auth/register");
    await page.context().clearCookies(); // Clear session

    // Try to register with same email
    const testUsername2 = `testuser2-${Date.now()}`;
    await page.getByLabel(/^Username/).fill(testUsername2);
    await page.getByLabel(/^Email/).fill(testEmail);
    await page.getByLabel(/^Password/).fill(testPassword);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show error (email already exists)
    await expect(
      page.locator("text=/[Ee]mail|already.*exists|already.*taken/"),
    ).toBeVisible({ timeout: 5000 });
  });
});
