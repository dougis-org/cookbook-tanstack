import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

test.describe("Recipe Serving Adjuster", () => {
  test("adjusts ingredient quantities and resets", async ({ page }) => {
    await registerAndLogin(page);

    const recipeName = getUniqueRecipeName("Serving Adjust");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "2 cups flour\n1 egg",
      instructions: "Mix and cook",
      servings: "2",
    });

    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    await expect(page.getByText("2 cups flour")).toBeVisible();

    await page.getByRole("button", { name: /increase servings/i }).click();
    await expect(page.getByText("3 cups flour")).toBeVisible();

    await page.getByRole("button", { name: /reset/i }).click();
    await expect(page.getByText("2 cups flour")).toBeVisible();
  });
});
