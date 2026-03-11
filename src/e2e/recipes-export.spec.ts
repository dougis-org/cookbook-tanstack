import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

test.describe("Recipe Export", () => {
  test("clicking Export initiates file download", async ({ page }) => {
    await registerAndLogin(page);

    const recipeName = getUniqueRecipeName("Export Recipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "2 cups flour",
      instructions: "Mix and bake",
      servings: "2",
    });

    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });
});
