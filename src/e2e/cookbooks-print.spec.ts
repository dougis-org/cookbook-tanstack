import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import {
  addRecipeToCookbook,
  createCookbook,
  getUniqueCookbookName,
} from "./helpers/cookbooks";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

// ─── Shared setup: public cookbook with two recipes ───────────────────────────

test.describe("Cookbook Print Route — public cookbook", () => {
  let cookbookId: string;
  let recipe1Name: string;
  let recipe2Name: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerAndLogin(page);

    recipe1Name = getUniqueRecipeName("PrintRecipe1");
    recipe2Name = getUniqueRecipeName("PrintRecipe2");
    const cookbookName = getUniqueCookbookName("PrintCookbook");

    // Create two recipes
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipe1Name,
      ingredients: "Flour\nSugar",
      instructions: "Mix and bake",
      servings: "4",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipe2Name,
      ingredients: "Butter\nEggs",
      instructions: "Cook gently",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Create public cookbook
    const cookbook = await createCookbook(page, cookbookName);
    cookbookId = cookbook.cookbookId;

    await addRecipeToCookbook(page, recipe1Name);
    await addRecipeToCookbook(page, recipe2Name);

    await page.close();
  });

  // 4.1
  test("unauthenticated user can load print route for a public cookbook without redirect", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    expect(page.url()).toContain(`/cookbooks/${cookbookId}/print`);
    await expect(page.getByText("Cookbook not found")).not.toBeVisible();
  });

  // 4.3
  test("TOC section lists all recipes in cookbook order with correct 1-based position numbers", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await expect(page.getByText("1.")).toBeVisible();
    await expect(page.getByText("2.")).toBeVisible();
    await expect(page.getByText(recipe1Name).first()).toBeVisible();
    await expect(page.getByText(recipe2Name).first()).toBeVisible();
  });

  test("displayonly mode shows #N labels for recipe sections and no pg-prefixed labels", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );

    const sections = page.locator(".cookbook-recipe-section");
    const labels = page.locator(".cookbook-recipe-position-label");
    await expect(sections).toHaveCount(2);
    await expect(labels).toHaveCount(2);
    await expect(labels.nth(0)).toHaveText("#1");
    await expect(labels.nth(1)).toHaveText("#2");
    await expect(page.getByText(/^pg \d+$/)).toHaveCount(0);
  });

  // 4.4
  test("each recipe section has the cookbook-recipe-section CSS class", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    const sections = page.locator(".cookbook-recipe-section");
    await expect(sections).toHaveCount(2);
  });

  // 4.5
  test("computed style of .cookbook-recipe-section has page-break rules", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await page.emulateMedia({ media: "print" });
    const section = page.locator(".cookbook-recipe-section").first();
    await expect(section).toHaveCSS("break-before", "page");
    await page.emulateMedia({ media: "screen" });
  });

  // 4.6
  test("no img elements are present on the print route", async ({ page }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await expect(page.locator(".cookbook-recipe-section img")).toHaveCount(0);
  });

  // 4.7
  test("serving controls are hidden when print media is active on the print route", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await expect(
      page.getByRole("button", { name: /increase servings/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /decrease servings/i }),
    ).toBeVisible();
    await page.emulateMedia({ media: "print" });
    await expect(
      page.getByRole("button", { name: /increase servings/i }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: /decrease servings/i }),
    ).toBeHidden();
    await page.emulateMedia({ media: "screen" });
  });

  // 4.8
  test("back link and Print button carry the print:hidden class", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    const backLink = page.getByRole("link", { name: /back to cookbook/i });
    await expect(backLink).toHaveClass(/print:hidden/);
    const printBtn = page.getByRole("button", { name: /print/i });
    await expect(printBtn).toHaveClass(/print:hidden/);
  });

  // 4.1 — TOC <ol> carries print:columns-2 class
  test("TOC <ol> in the print route carries the print:columns-2 class", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    const tocList = page.locator("ol").first();
    await expect(tocList).toHaveClass(/print:columns-2/);
  });

  // 4.3 — TOC recipe entries are <a> links to /recipes/$recipeId
  test("TOC recipe entries in the print route are links to /recipes/$recipeId", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    // All recipe entries in the TOC <ol> should be <a> links to recipe pages
    const tocLinks = page.locator("ol").first().locator("a");
    const count = await tocLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(tocLinks.nth(i)).toHaveAttribute(
        "href",
        /\/recipes\/[a-f0-9-]+/,
      );
    }
  });
});

// ─── Private cookbook ─────────────────────────────────────────────────────────

// 4.2
test("unauthenticated user sees not-found state for a private cookbook print route", async ({
  page,
}) => {
  await registerAndLogin(page);
  const cookbookName = getUniqueCookbookName("PrivatePrint");
  const { cookbookId } = await createCookbook(page, cookbookName, {
    isPublic: false,
  });

  await page.context().clearCookies();
  await gotoAndWaitForHydration(
    page,
    `/cookbooks/${cookbookId}/print?displayonly=1`,
  );
  await expect(page.getByText("Cookbook not found")).toBeVisible();
});
