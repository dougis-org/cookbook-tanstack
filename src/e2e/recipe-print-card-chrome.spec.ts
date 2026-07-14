import type { Locator } from "@playwright/test";
import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import {
  addRecipeToCookbook,
  createCookbook,
  getUniqueCookbookName,
} from "./helpers/cookbooks";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

/**
 * Tailwind's `shadow-none` resolves the shadow custom properties to
 * transparent (`rgba(0, 0, 0, 0) 0 0 0 0`, repeated per shadow layer) rather
 * than the literal keyword `none`, so assert every layer is fully
 * transparent instead of string-matching "none".
 */
async function expectNoVisibleShadow(locator: Locator) {
  await expect(async () => {
    const boxShadow = await locator.evaluate((el) => window.getComputedStyle(el).boxShadow);
    expect(boxShadow === "none" || !/rgba\((?!0, 0, 0, 0\))/.test(boxShadow)).toBe(true);
  }).toPass();
}

// Covers the remove-print-parchment-wrapper change (#598): RecipeDetail's
// outer card wrapper must show no background fill, rounding, or shadow when
// printed, on both the standalone recipe page and inside cookbook print.
test.describe("Recipe detail print card chrome suppression", () => {
  let recipeId: string;
  let recipeName: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerAndLogin(page);

    recipeName = getUniqueRecipeName("PrintChromeRecipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "Flour\nSugar",
      instructions: "Mix and bake",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
    recipeId = page.url().split("/recipes/")[1];

    await page.close();
  });

  test("card chrome suppressed on standalone recipe print", async ({ page }) => {
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);
    await page.emulateMedia({ media: "print" });

    const card = page.locator("div.shadow-lg");
    await expectNoVisibleShadow(card);
    await expect(card).toHaveCSS("border-radius", "0px");

    await page.emulateMedia({ media: "screen" });
  });

  test("card chrome visible on screen (regression guard)", async ({ page }) => {
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);

    const card = page.locator("div.shadow-lg");
    await expect(card).not.toHaveCSS("border-radius", "0px");
    const boxShadow = await card.evaluate((el) => window.getComputedStyle(el).boxShadow);
    expect(/rgba\((?!0, 0, 0, 0\))/.test(boxShadow)).toBe(true);
  });

  test("card chrome suppressed in cookbook print view", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("PrintChromeCookbook");
    const cookbook = await createCookbook(page, cookbookName);
    await addRecipeToCookbook(page, recipeName);

    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbook.cookbookId}/print?displayonly=1`,
    );
    await page.emulateMedia({ media: "print" });

    const section = page.locator(".cookbook-recipe-section").first();
    const card = section.locator("div.shadow-lg");
    await expectNoVisibleShadow(card);
    await expect(card).toHaveCSS("border-radius", "0px");

    await page.emulateMedia({ media: "screen" });
  });
});
