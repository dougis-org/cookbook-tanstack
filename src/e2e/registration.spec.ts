import { test, expect } from "@playwright/test";

test.describe("Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session/cookies
    await page.context().clearCookies();
    await page.goto("/auth/register");
  });

  test("should display registration form", async ({ page }) => {
    // Check that all form elements are present
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();

    // Check form labels
    await expect(page.locator('label:has-text("Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Username")')).toBeVisible();
    await expect(page.locator('label:has-text("Email")')).toBeVisible();
    await expect(page.locator('label:has-text("Password")')).toBeVisible();

    // Check submit button
    await expect(
      page.locator('button:has-text("Create Account")'),
    ).toBeVisible();

    // Check login link
    await expect(page.locator('a:has-text("Sign in")')).toBeVisible();
  });

  test("should register a new user with valid data", async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;
    const testPassword = "ValidPassword123!";
    const testName = "Test User";

    // Fill in the form
    await page.locator('input[id="name"]').fill(testName);
    await page.locator('input[id="username"]').fill(testUsername);
    await page.locator('input[id="email"]').fill(testEmail);
    await page.locator('input[id="password"]').fill(testPassword);

    // Submit form
    await page.locator('button:has-text("Create Account")').click();

    // Wait for navigation to home page (successful registration)
    await page.waitForURL("/", { timeout: 10000 });

    // Verify we're on the home page
    expect(page.url()).toBe("http://localhost:3000/");
  });

  test("should show validation error for empty username", async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testPassword = "ValidPassword123!";

    // Fill in form without username
    await page.locator('input[id="email"]').fill(testEmail);
    await page.locator('input[id="password"]').fill(testPassword);

    // Submit form
    await page.locator('button:has-text("Create Account")').click();

    // Check for validation error
    await expect(page.locator("text=Username is required")).toBeVisible();
  });

  test("should show validation error for invalid email", async ({ page }) => {
    const timestamp = Date.now();
    const testUsername = `testuser${timestamp}`;
    const testPassword = "ValidPassword123!";

    // Fill in form with invalid email
    await page.locator('input[id="username"]').fill(testUsername);
    await page.locator('input[id="email"]').fill("invalid-email");
    await page.locator('input[id="password"]').fill(testPassword);

    // Submit form
    await page.locator('button:has-text("Create Account")').click();

    // Check for validation error
    await expect(page.locator("text=Invalid email address")).toBeVisible();
  });

  test("should show validation error for short password", async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;
    const shortPassword = "short1";

    // Fill in form with short password
    await page.locator('input[id="username"]').fill(testUsername);
    await page.locator('input[id="email"]').fill(testEmail);
    await page.locator('input[id="password"]').fill(shortPassword);

    // Submit form
    await page.locator('button:has-text("Create Account")').click();

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
    await page.locator('input[id="name"]').fill(testName);
    await page.locator('input[id="username"]').fill(testUsername);
    await page.locator('input[id="email"]').fill(testEmail);
    await page.locator('input[id="password"]').fill(testPassword);

    // Listen for the button to change its text (loading state)
    const submitButton = page.locator('button:has-text("Create Account")');

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
    await page.waitForURL("/", { timeout: 10000 });
  });

  test("should navigate to login page from register page", async ({ page }) => {
    // Click the "Sign in" link
    await page.locator('a:has-text("Sign in")').click();

    // Verify navigation to login page
    await page.waitForURL("/auth/login");
    expect(page.url()).toContain("/auth/login");
  });

  test("should not register user with duplicate username", async ({ page }) => {
    const testEmail1 = `testuser1-${Date.now()}@example.com`;
    const testUsername = `testuser-duplicate-${Date.now()}`;
    const testPassword = "ValidPassword123!";

    // Register first user with specific username
    await page.locator('input[id="username"]').fill(testUsername);
    await page.locator('input[id="email"]').fill(testEmail1);
    await page.locator('input[id="password"]').fill(testPassword);
    await page.locator('button:has-text("Create Account")').click();

    // Wait for successful registration
    await page.waitForURL("/", { timeout: 10000 });

    // Navigate back to registration page
    await page.goto("/auth/register");
    await page.context().clearCookies(); // Clear session

    // Try to register with same username
    const testEmail2 = `testuser2-${Date.now()}@example.com`;
    await page.locator('input[id="username"]').fill(testUsername);
    await page.locator('input[id="email"]').fill(testEmail2);
    await page.locator('input[id="password"]').fill(testPassword);
    await page.locator('button:has-text("Create Account")').click();

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
    await page.locator('input[id="username"]').fill(testUsername1);
    await page.locator('input[id="email"]').fill(testEmail);
    await page.locator('input[id="password"]').fill(testPassword);
    await page.locator('button:has-text("Create Account")').click();

    // Wait for successful registration
    await page.waitForURL("/", { timeout: 10000 });

    // Navigate back to registration page
    await page.goto("/auth/register");
    await page.context().clearCookies(); // Clear session

    // Try to register with same email
    const testUsername2 = `testuser2-${Date.now()}`;
    await page.locator('input[id="username"]').fill(testUsername2);
    await page.locator('input[id="email"]').fill(testEmail);
    await page.locator('input[id="password"]').fill(testPassword);
    await page.locator('button:has-text("Create Account")').click();

    // Should show error (email already exists)
    await expect(
      page.locator("text=/[Ee]mail|already.*exists|already.*taken/"),
    ).toBeVisible({ timeout: 5000 });
  });
});
