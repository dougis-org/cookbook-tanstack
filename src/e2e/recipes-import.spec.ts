import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLoginWithTier } from "./helpers/admin";
import { gotoAndWaitForHydration } from "./helpers/app";

test.describe("Recipe Import", () => {
  test("imports a JSON recipe and redirects to detail page", async ({
    page,
  }) => {
    await registerAndLoginWithTier(page, "sous-chef");

    await gotoAndWaitForHydration(page, "/import");

    const payload = {
      name: `Imported-${Date.now()}`,
      ingredients: "2 cups flour\n1 egg",
      instructions: "Mix\nBake",
      servings: 3,
      difficulty: "easy",
      _version: "1",
      isPublic: true,
    };

    await page.getByTestId("import-file-input").setInputFiles({
      name: "import-recipe.json",
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
