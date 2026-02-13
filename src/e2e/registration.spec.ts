import { test, expect } from "@playwright/test";

test.describe("Registration Form UI", () => {
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

  test("should fill registration form with valid data", async ({ page }) => {
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

    // Verify all fields are filled
    await expect(page.getByLabel(/^Name$/)).toHaveValue(testName);
    await expect(page.getByLabel(/^Username/)).toHaveValue(testUsername);
    await expect(page.getByLabel(/^Email/)).toHaveValue(testEmail);
    await expect(page.getByLabel(/^Password/)).toHaveValue(testPassword);
  });

  test("should have accessible form labels", async ({ page }) => {
    // Verify name field has proper label
    const nameInput = page.getByLabel(/^Name$/);
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute('id', 'name');

    // Verify username field has proper label
    const usernameInput = page.getByLabel(/^Username/);
    await expect(usernameInput).toBeVisible();
    await expect(usernameInput).toHaveAttribute('id', 'username');

    // Verify email field has proper label
    const emailInput = page.getByLabel(/^Email/);
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('id', 'email');

    // Verify password field has proper label
    const passwordInput = page.getByLabel(/^Password/);
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('id', 'password');
  });

  test("should mark required fields with asterisk", async ({ page }) => {
    // Username should be marked required
    const usernameLabel = page.locator('label').filter({ hasText: /^Username/ });
    const requirementMarker = usernameLabel.locator('span:has-text("*")');
    await expect(requirementMarker).toBeVisible();

    // Email should be marked required
    const emailLabel = page.locator('label').filter({ hasText: /^Email/ });
    const emailRequirement = emailLabel.locator('span:has-text("*")');
    await expect(emailRequirement).toBeVisible();

    // Password should be marked required
    const passwordLabel = page.locator('label').filter({ hasText: /^Password/ });
    const passwordRequirement = passwordLabel.locator('span:has-text("*")');
    await expect(passwordRequirement).toBeVisible();

    // Name should NOT be marked required
    const nameLabel = page.locator('label').filter({ hasText: /^Name$/ });
    const nameMarker = nameLabel.locator('span:has-text("*")');
    await expect(nameMarker).not.toBeVisible();
  });

  test("should display form field placeholders", async ({ page }) => {
    // Check all placeholder text is visible
    await expect(page.getByPlaceholder('Your display name (optional)')).toBeVisible();
    await expect(page.getByPlaceholder('Choose a unique username')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('At least 8 characters')).toBeVisible();
  });

  test("should have correct input types", async ({ page }) => {
    // Name should be text type
    await expect(page.getByLabel(/^Name$/)).toHaveAttribute('type', 'text');

    // Username should be text type
    await expect(page.getByLabel(/^Username/)).toHaveAttribute('type', 'text');

    // Email should be email type
    await expect(page.getByLabel(/^Email/)).toHaveAttribute('type', 'email');

    // Password should be password type
    await expect(page.getByLabel(/^Password/)).toHaveAttribute('type', 'password');
  });

  test("should enable submit button", async ({ page }) => {
    const submitButton = page.getByRole('button', { name: 'Create Account' });

    // Button should start enabled
    await expect(submitButton).toBeEnabled();

    // Fill with valid data
    const timestamp = Date.now();
    await page.getByLabel(/^Username/).fill(`testuser${timestamp}`);
    await page.getByLabel(/^Email/).fill(`test${timestamp}@example.com`);
    await page.getByLabel(/^Password/).fill('ValidPassword123!');

    // Button should remain enabled
    await expect(submitButton).toBeEnabled();
  });

  test("should navigate to login page from register page", async ({ page }) => {
    // Click the "Sign in" link
    await page.getByRole('link', { name: 'Sign in' }).click();

    // Verify navigation to login page
    await page.waitForURL("/auth/login");
    expect(page.url()).toContain("/auth/login");
  });

  test("should have proper form structure", async ({ page }) => {
    // Verify form element exists
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Verify form has noValidate attribute (client-side validation only)
    await expect(form).toHaveAttribute('novalidate', '');

    // Verify form has onSubmit handler by checking it responds to submit
    // Check that there's a submit button inside the form
    const formButton = form.locator('button[type="submit"]');
    await expect(formButton).toBeVisible();
    await expect(formButton).toContainText('Create Account');
  });

  test("should accept input in all form fields", async ({ page }) => {
    // Test that each field accepts different types of input
    const nameInput = page.getByLabel(/^Name$/);
    await nameInput.fill('John Doe');
    await expect(nameInput).toHaveValue('John Doe');

    const usernameInput = page.getByLabel(/^Username/);
    await usernameInput.fill('john_doe_123');
    await expect(usernameInput).toHaveValue('john_doe_123');

    const emailInput = page.getByLabel(/^Email/);
    await emailInput.fill('john@example.com');
    await expect(emailInput).toHaveValue('john@example.com');

    const passwordInput = page.getByLabel(/^Password/);
    await passwordInput.fill('MySecurePassword!123');
    await expect(passwordInput).toHaveValue('MySecurePassword!123');
  });

  test("should clear form fields when new values are entered", async ({ page }) => {
    const timestamp = Date.now();
    const usernameInput = page.getByLabel(/^Username/);

    // Fill field
    await usernameInput.fill(`user${timestamp}`);
    await expect(usernameInput).toHaveValue(`user${timestamp}`);

    // Clear and fill with new value
    await usernameInput.clear();
    await usernameInput.fill(`newuser${timestamp}`);
    await expect(usernameInput).toHaveValue(`newuser${timestamp}`);
  });
});
