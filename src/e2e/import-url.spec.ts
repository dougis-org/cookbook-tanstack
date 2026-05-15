import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLoginWithTier } from "./helpers/admin";
import { gotoAndWaitForHydration } from "./helpers/app";

test.describe("URL Recipe Import", () => {
  test("URL input is displayed above file import section", async ({ page }) => {
    await registerAndLoginWithTier(page, "executive-chef");
    await gotoAndWaitForHydration(page, "/import");

    const urlInput = page.locator('input[type="url"]');
    await expect(urlInput).toBeVisible();

    const urlBox = await page.getByText(/import from url/i).boundingBox();
    const fileBox = await page.getByText(/import from file/i).boundingBox();
    expect(urlBox!.y).toBeLessThan(fileBox!.y);
  });

  test("shows error when URL import fails to reach server", async ({ page }) => {
    await registerAndLoginWithTier(page, "executive-chef");
    await gotoAndWaitForHydration(page, "/import");

    await page
      .locator('input[type="url"]')
      .fill("https://invalid-site-that-does-not-exist-12345.example/recipe");

    await page.getByRole("button", { name: /import url/i }).click();

    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
  });

  test("shows tier wall for non-executive-chef users", async ({ page }) => {
    await registerAndLoginWithTier(page, "home-cook");
    await gotoAndWaitForHydration(page, "/import");

    await expect(page.getByText(/Import requires Executive Chef/i)).toBeVisible();
    await expect(
      page.locator('input[type="url"]'),
    ).not.toBeVisible();
  });

  test("file import still works alongside URL import", async ({ page }) => {
    await registerAndLoginWithTier(page, "executive-chef");
    await gotoAndWaitForHydration(page, "/import");

    const payload = {
      name: `URLImportRegression-${Date.now()}`,
      ingredients: "eggs, flour",
      instructions: "Mix and bake",
      servings: 4,
      _version: "1",
      isPublic: true,
    };

    await page.getByTestId("import-file-input").setInputFiles({
      name: "recipe.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(payload)),
    });

    await expect(
      page.getByRole("dialog", { name: "Import preview" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /confirm import/i }).click();
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    await expect(
      page.getByRole("heading", { name: payload.name }),
    ).toBeVisible();
  });
});
