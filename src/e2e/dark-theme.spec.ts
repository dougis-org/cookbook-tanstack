import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { submitRecipeForm } from "./helpers/recipes";

test.describe("Dark Theme", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("html element has dark class", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/");

    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
    expect(hasDarkClass).toBe(true);
  });

  test("dark class is present in server-rendered HTML before hydration", async ({
    page,
  }) => {
    // waitUntil: 'commit' resolves as soon as the response is received and
    // the initial HTML begins parsing — before any scripts execute.
    // The dark class must be present at this point (SSR, not client-side JS).
    await page.goto("/", { waitUntil: "commit" });

    const hasDarkClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
    expect(hasDarkClass).toBe(true);
  });

  test("recipe cards render with dark background when dark mode is active", async ({
    page,
  }) => {
    await registerAndLogin(page);

    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: `Dark Theme Test Recipe ${Date.now()}` });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    await gotoAndWaitForHydration(page, "/recipes");

    const card = page.locator('[data-testid="recipe-card"]').first();
    await expect(card).toBeVisible();

    const backgroundColor = await card.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    // Tailwind v4 reports colors in oklch; assert it is not the light-mode white background.
    expect(backgroundColor).not.toBe("rgb(255, 255, 255)");
  });
});
