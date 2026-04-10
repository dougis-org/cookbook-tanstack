import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration, waitForHydration } from "./helpers/app";

function isBetterAuthCookie(name: string) {
  return name.includes("better-auth");
}

function isSessionTokenCookie(name: string) {
  return name.includes("session_token");
}

test.describe("Auth session flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("persists an authenticated session across a full page reload", async ({
    page,
  }) => {
    const creds = await registerAndLogin(page);

    await gotoAndWaitForHydration(page, "/auth/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByText(creds.email)).toBeVisible();

    await page.reload();
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);

    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByText(creds.email)).toBeVisible();
  });

  test("stays authenticated when the short-lived cookie cache is absent", async ({
    page,
  }) => {
    const creds = await registerAndLogin(page);

    await gotoAndWaitForHydration(page, "/auth/profile");

    const cookies = await page.context().cookies();
    const authCookies = cookies.filter((cookie) =>
      isBetterAuthCookie(cookie.name),
    );
    const sessionToken = authCookies.find((cookie) =>
      isSessionTokenCookie(cookie.name),
    );

    expect(sessionToken).toBeDefined();
    expect(authCookies.length).toBeGreaterThan(1);

    await page.context().clearCookies();
    await page.context().addCookies([sessionToken!]);

    await gotoAndWaitForHydration(page, "/auth/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByText(creds.email)).toBeVisible();
  });

  test("signs out cleanly and redirects protected routes back to login", async ({
    page,
  }) => {
    await registerAndLogin(page);

    await gotoAndWaitForHydration(page, "/");
    await page.getByRole("button", { name: "Logout" }).click();
    await page.waitForURL(/\/auth\/login/);

    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();

    await gotoAndWaitForHydration(page, "/auth/profile");
    await page.waitForURL(/\/auth\/login/);
  });
});
