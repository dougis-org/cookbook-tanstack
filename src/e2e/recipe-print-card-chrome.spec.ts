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

/** Extracts every alpha value from a computed `rgba(...)`/`rgb(...)` box-shadow or background-color string. */
function shadowAlphaValues(value: string): number[] {
  return [...value.matchAll(/rgba?\(([^)]+)\)/g)].map((match) => {
    const parts = match[1].split(",").map((part) => part.trim());
    return parts.length === 4 ? Number(parts[3]) : 1;
  });
}

async function expectChromeSuppressed(card: Locator) {
  await expect(async () => {
    const boxShadow = await card.evaluate((el) => window.getComputedStyle(el).boxShadow);
    expect(boxShadow === "none" || shadowAlphaValues(boxShadow).every((alpha) => alpha === 0)).toBe(true);
  }).toPass();
  await expect(card).toHaveCSS("border-radius", "0px");
  const backgroundColor = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  expect(shadowAlphaValues(backgroundColor).every((alpha) => alpha === 0)).toBe(true);
}

async function expectChromeVisible(card: Locator) {
  await expect(card).not.toHaveCSS("border-radius", "0px");
  const boxShadow = await card.evaluate((el) => window.getComputedStyle(el).boxShadow);
  expect(shadowAlphaValues(boxShadow).some((alpha) => alpha > 0)).toBe(true);
}

// Covers the remove-print-parchment-wrapper change (#598): RecipeDetail's
// outer card wrapper must show no background fill, rounding, or shadow when
// printed, on both the standalone recipe page and inside cookbook print.
test.describe("Recipe detail print card chrome suppression", () => {
  let recipeId: string;
  let cookbookId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerAndLogin(page);

    const recipeName = getUniqueRecipeName("PrintChromeRecipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "Flour\nSugar",
      instructions: "Mix and bake",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
    recipeId = page.url().split("/recipes/")[1];

    const cookbookName = getUniqueCookbookName("PrintChromeCookbook");
    const cookbook = await createCookbook(page, cookbookName);
    cookbookId = cookbook.cookbookId;
    await addRecipeToCookbook(page, recipeName);

    await page.close();
  });

  test("card chrome suppressed on standalone recipe print", async ({ page }) => {
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);
    await page.emulateMedia({ media: "print" });

    await expectChromeSuppressed(page.locator("div.shadow-lg"));

    await page.emulateMedia({ media: "screen" });
  });

  test("card chrome visible on screen (regression guard)", async ({ page }) => {
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);

    await expectChromeVisible(page.locator("div.shadow-lg"));
  });

  test("card chrome suppressed in cookbook print view", async ({ page }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await page.emulateMedia({ media: "print" });

    const section = page.locator(".cookbook-recipe-section").first();
    await expectChromeSuppressed(section.locator("div.shadow-lg"));

    await page.emulateMedia({ media: "screen" });
  });
});
