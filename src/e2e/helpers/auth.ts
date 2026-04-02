import type { Page } from "@playwright/test";
import { gotoAndWaitForHydration } from "./app";

interface RegisterOptions {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
}

function getAuthOrigin(page: Page) {
  return process.env.BETTER_AUTH_URL
    ? new URL(process.env.BETTER_AUTH_URL).origin
    : new URL(page.url()).origin;
}

/**
 * Register a new unique test user via the auth API and set the session cookie.
 * Uses page.request (which shares the browser cookie jar) to avoid React
 * hydration timing issues with the UI form.
 * Returns the credentials used so tests can re-login if needed.
 */
export async function registerAndLogin(page: Page, opts: RegisterOptions = {}) {
  const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const name = opts.name ?? "Test User";
  const username = opts.username ?? `testuser${suffix}`;
  const email = opts.email ?? `testuser${suffix}@example.com`;
  const password = opts.password ?? "ValidPassword123!";

  // Ensure the app is running and we have a page origin.
  await gotoAndWaitForHydration(page, "/");

  // Better Auth validates Origin against the configured BETTER_AUTH_URL.
  // Prefer that value when available (e.g., in test environments).
  const origin = getAuthOrigin(page);

  const response = await page.request.post("/api/auth/sign-up/email", {
    data: { email, password, name, username, displayUsername: username },
    headers: { Origin: origin },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Registration failed: ${response.status()} ${body}`);
  }

  const signInResponse = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password },
    headers: { Origin: origin },
  });

  if (!signInResponse.ok()) {
    const body = await signInResponse.text();
    throw new Error(
      `Post-registration login failed: ${signInResponse.status()} ${body}`,
    );
  }

  await gotoAndWaitForHydration(page, "/");

  return { name, username, email, password };
}

/**
 * Log in an existing user via the auth API and set the session cookie.
 */
export async function login(page: Page, email: string, password: string) {
  await gotoAndWaitForHydration(page, "/");

  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password },
    headers: { Origin: getAuthOrigin(page) },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Login failed: ${response.status()} ${body}`);
  }

  await gotoAndWaitForHydration(page, "/");
}
