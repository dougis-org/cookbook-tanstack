import { test, expect } from "@bgotink/playwright-coverage";
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
    // Inspect the raw HTML response body to confirm the dark class is emitted
    // by the server, not added client-side by JavaScript.
    const response = await page.goto("/", { waitUntil: "commit" });
    expect(response).not.toBeNull();

    const html = await response!.text();
    expect(html).toMatch(/<html[^>]*class=["'][^"']*\bdark\b[^"']*["']/);
  });

  test("dev server HTML includes the React refresh preamble marker", async ({
    page,
  }) => {
    test.skip(
      process.env.PLAYWRIGHT_VITE_DEV_SMOKE !== "true",
      "PLAYWRIGHT_VITE_DEV_SMOKE is not enabled",
    );

    const response = await page.goto("/", { waitUntil: "commit" });
    expect(response).not.toBeNull();

    const html = await response!.text();
    expect(html).toContain("window.__vite_plugin_react_preamble_installed__ = true;");
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
    // Tailwind v4 reports colors in oklch; assert it is neither the light-mode
    // white background nor transparent (which would be a false-negative miss).
    expect(backgroundColor).not.toBe("rgb(255, 255, 255)");
    expect(backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  });
});
