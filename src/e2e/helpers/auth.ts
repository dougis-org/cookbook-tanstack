import type { Page } from "@playwright/test"

interface RegisterOptions {
  name?: string
  username?: string
  email?: string
  password?: string
}

/**
 * Register a new unique test user and log in via the UI forms.
 * Returns the credentials used so tests can re-login if needed.
 */
export async function registerAndLogin(page: Page, opts: RegisterOptions = {}) {
  const timestamp = Date.now()
  const name = opts.name ?? "Test User"
  const username = opts.username ?? `testuser${timestamp}`
  const email = opts.email ?? `testuser${timestamp}@example.com`
  const password = opts.password ?? "ValidPassword123!"

  await page.goto("/auth/register")
  // Wait for React hydration — SSR renders the form HTML but event handlers
  // (e.g. onSubmit with e.preventDefault()) aren't attached until hydration.
  await page.waitForLoadState("networkidle")

  await page.getByLabel(/^Name$/).fill(name)
  await page.getByLabel(/^Username/).fill(username)
  await page.getByLabel(/^Email/).fill(email)
  await page.getByLabel(/^Password/).fill(password)

  // Listen for the signup POST response before clicking submit
  const signUpResponse = page.waitForResponse(
    (resp) =>
      resp.request().method() === "POST" &&
      resp.url().includes("/api/auth") &&
      resp.ok(),
  )
  await page.getByRole("button", { name: "Create Account" }).click()
  await signUpResponse

  // Session cookie is now set; navigate ourselves since the client-side
  // redirect after signUp can be unreliable under CI timing conditions.
  await page.goto("/")

  return { name, username, email, password }
}

/**
 * Log in an existing user via the login form.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login")
  await page.getByLabel(/^Email/).fill(email)
  await page.getByLabel(/^Password/).fill(password)
  await page.getByRole("button", { name: "Sign In" }).click()
  await page.waitForURL("/")
}
