import { test, expect } from "@bgotink/playwright-coverage";
import type { Page, Locator } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import {
  addRecipeToCookbook,
  createCookbook,
  createCookbookWithRecipe,
  getUniqueCookbookName,
} from "./helpers/cookbooks";
import { getUniqueRecipeName, submitRecipeForm } from "./helpers/recipes";

async function createChapter(page: Page, chapterNumber: number) {
  await page.getByRole("button", { name: "New Chapter" }).click();
  await expect(page.getByRole("button", { name: "New Chapter" })).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: new RegExp(`Chapter ${chapterNumber}`, "i") }),
  ).toBeVisible({ timeout: 20000 });
}

async function hoverChapterAndClickAction(
  page: Page,
  chapterNumber: number,
  action: string,
) {
  await page
    .getByRole("heading", { name: new RegExp(`Chapter ${chapterNumber}`, "i") })
    .hover();
  await page
    .getByLabel(new RegExp(`${action} Chapter ${chapterNumber}`))
    .click({ force: true });
}

async function setupCookbookWithRecipe(page: Page, label: string) {
  await registerAndLogin(page);
  const result = await createCookbookWithRecipe(page, label);
  await gotoAndWaitForHydration(page, result.cookbookUrl);
  return result;
}

test.describe("Cookbook Chapters", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should create a chapter and rename it", async ({ page }) => {
    await setupCookbookWithRecipe(page, "Chapters Create Rename");

    await createChapter(page, 1);

    await hoverChapterAndClickAction(page, 1, "Rename");
    await expect(
      page.getByRole("textbox", { name: "Chapter name" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Chapter name" }).fill("Starters");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("heading", { name: "Starters" })).toBeVisible({
      timeout: 20000,
    });
    await expect(
      page.getByRole("heading", { name: /Chapter 1/i }),
    ).not.toBeVisible();
  });

  test("should show New Chapter button only for owner", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Chapters Owner Only");
    const { cookbookUrl } = await createCookbook(page, cookbookName);

    await expect(
      page.getByRole("button", { name: "New Chapter" }),
    ).toBeVisible();

    await page.context().clearCookies();
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, cookbookUrl);
    await expect(
      page.getByRole("button", { name: "New Chapter" }),
    ).not.toBeVisible();
  });

  test("should delete last chapter and unchapter all recipes", async ({
    page,
  }) => {
    const { recipeName } = await setupCookbookWithRecipe(
      page,
      "Chapters Delete Last",
    );

    await createChapter(page, 1);
    await expect(page.getByText(recipeName)).toBeVisible();

    await hoverChapterAndClickAction(page, 1, "Delete");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(
      page.getByRole("heading", { name: /Chapter 1/i }),
    ).not.toBeVisible({ timeout: 20000 });
    await expect(page.getByText(recipeName)).toBeVisible();
  });

  test("should show drag handles for recipes within chapters", async ({
    page,
  }) => {
    await setupCookbookWithRecipe(page, "Cross Chapter Drag");

    await createChapter(page, 1);

    await expect(
      page.getByRole("button", { name: "Drag to reorder" }),
    ).toBeVisible();
  });

  test("should drag a recipe from a populated chapter into an empty chapter", async ({
    page,
  }) => {
    const { cookbookUrl, recipeName } = await setupCookbookWithRecipe(
      page,
      "Drag To Empty Chapter",
    );

    const recipe2Name = getUniqueRecipeName("Drag To Empty Chapter B");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: recipe2Name });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    await gotoAndWaitForHydration(page, cookbookUrl);
    await addRecipeToCookbook(page, recipe2Name);
    await expect(page.getByText(recipe2Name)).toBeVisible();

    await createChapter(page, 1);
    await expect(page.getByText(recipeName)).toBeVisible();
    await expect(page.getByText(recipe2Name)).toBeVisible();

    await createChapter(page, 2);
    await expect(page.getByText("Drop a recipe here")).toBeVisible();

    const recipe1Card = page
      .locator('[data-testid="recipe-card"]')
      .filter({ hasText: recipeName });
    const dragHandle = recipe1Card.getByRole("button", {
      name: "Drag to reorder",
    });
    const dropZone = page.getByText("Drop a recipe here");

    const handleBox = await dragHandle.boundingBox();
    const dropBox = await dropZone.boundingBox();

    expect(handleBox).not.toBeNull();
    expect(dropBox).not.toBeNull();

    await page.mouse.move(
      handleBox!.x + handleBox!.width / 2,
      handleBox!.y + handleBox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      dropBox!.x + dropBox!.width / 2,
      dropBox!.y + dropBox!.height / 2,
      { steps: 30 },
    );
    await page.mouse.up();

    const chapter2Section = page
      .locator('[data-testid^="chapter-section-"]')
      .filter({ has: page.getByRole("heading", { name: /Chapter 2/i }) });
    await expect(chapter2Section.getByText(recipeName)).toBeVisible({
      timeout: 20000,
    });

    const chapter1Section = page
      .locator('[data-testid^="chapter-section-"]')
      .filter({ has: page.getByRole("heading", { name: /Chapter 1/i }) });
    await expect(chapter1Section.getByText(recipe2Name)).toBeVisible();
    await expect(chapter1Section.getByText(recipeName)).not.toBeVisible();
  });

  test("should toggle collapsed mode and show chapter rows", async ({
    page,
  }) => {
    await setupCookbookWithRecipe(page, "Chapters Collapse");

    await createChapter(page, 1);
    await createChapter(page, 2);

    const collapseBtn = page.getByRole("button", {
      name: /Collapse to chapter view|Expand recipe list/,
    });
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();

    await expect(page.getByText(/Chapter 1/i)).toBeVisible();
    await expect(page.getByText(/Chapter 2/i)).toBeVisible();
  });
});

test.describe("Build Chapters by Category", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should preview and build chapters grouped by recipe category", async ({
    page,
  }) => {
    await registerAndLogin(page);

    const appetizerRecipe = getUniqueRecipeName("Build Chapters Appetizer");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: appetizerRecipe, category: "Appetizers" });
    await page.waitForURL(/\/recipes\/[a-f0-9]{24}$/i);

    const dessertRecipe = getUniqueRecipeName("Build Chapters Dessert");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: dessertRecipe, category: "Desserts" });
    await page.waitForURL(/\/recipes\/[a-f0-9]{24}$/i);

    const cookbookName = getUniqueCookbookName("Build Chapters");
    const { cookbookUrl } = await createCookbook(page, cookbookName);
    await addRecipeToCookbook(page, appetizerRecipe);
    await addRecipeToCookbook(page, dessertRecipe);

    const buildButton = page.getByRole("button", {
      name: "Build Chapters by Category",
    });
    await expect(buildButton).toBeEnabled();
    await buildButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Appetizers")).toBeVisible();
    await expect(dialog.getByText("Desserts")).toBeVisible();

    await dialog.getByRole("button", { name: "Confirm" }).click();
    await expect(dialog).not.toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Appetizers" }),
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("heading", { name: "Desserts" })).toBeVisible();

    const appetizersSection = page
      .locator('[data-testid^="chapter-section-"]')
      .filter({ has: page.getByRole("heading", { name: "Appetizers" }) });
    await expect(appetizersSection.getByText(appetizerRecipe)).toBeVisible();

    const dessertsSection = page
      .locator('[data-testid^="chapter-section-"]')
      .filter({ has: page.getByRole("heading", { name: "Desserts" }) });
    await expect(dessertsSection.getByText(dessertRecipe)).toBeVisible();

    // Every recipe is now chaptered, so the button is disabled again.
    await gotoAndWaitForHydration(page, cookbookUrl);
    await expect(buildButton).toBeDisabled();
  });

  test("should not show the button for a non-owner, non-editor viewer", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Build Chapters Viewer");
    const { cookbookUrl } = await createCookbook(page, cookbookName);

    await expect(
      page.getByRole("button", { name: "Build Chapters by Category" }),
    ).toBeVisible();

    await page.context().clearCookies();
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, cookbookUrl);
    await expect(
      page.getByRole("button", { name: "Build Chapters by Category" }),
    ).not.toBeVisible();
  });
});

test.describe("Sorting Cookbook Recipes", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should cancel sorting without changes", async ({ page }) => {
    await registerAndLogin(page);
    const { cookbookUrl } = await createCookbook(page, getUniqueCookbookName("Sort Cancel"));
    await gotoAndWaitForHydration(page, cookbookUrl);

    // Click Resort All and cancel
    await page.getByRole("button", { name: "Resort All" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  // Prefixes chosen so that naive `localeCompare` ordering ("A Banana", "Apple",
  // "The Zebra", "Yellow") differs from the app's article-stripping order
  // ("Apple", "A Banana", "Yellow", "The Zebra"). This ensures the assertions
  // below actually exercise the custom normalization, not just plain string sort.
  const ARTICLE_STRIPPED_ORDER = ["Apple", "A Banana", "Yellow", "The Zebra"];

  async function recipeCardTitles(scope: Locator | Page) {
    return scope.locator('[data-testid="recipe-card"] a').allTextContents();
  }

  function expectPrefixOrder(titles: string[], expectedPrefixes: string[]) {
    expect(titles).toHaveLength(expectedPrefixes.length);
    titles.forEach((title, i) => {
      expect(title.startsWith(expectedPrefixes[i])).toBe(true);
    });
  }

  // Creates recipes one at a time (not in parallel) since they share a single `page`
  // and concurrent navigations would abort each other.
  async function createRecipes(page: Page, prefixes: string[]) {
    const names: string[] = [];
    for (const prefix of prefixes) {
      const name = getUniqueRecipeName(prefix);
      await gotoAndWaitForHydration(page, "/recipes/new");
      await submitRecipeForm(page, { name });
      await page.waitForURL(/\/recipes\/[a-f0-9]{24}$/i);
      names.push(name);
    }
    return names;
  }

  test("should sort entire cookbook by title, stripping leading articles", async ({ page }) => {
    await registerAndLogin(page);

    // Create recipes in non-alphabetical order
    const names = await createRecipes(page, ["The Zebra", "Apple", "Yellow", "A Banana"]);

    const { cookbookUrl } = await createCookbook(page, getUniqueCookbookName("Sort E2E"));
    await gotoAndWaitForHydration(page, cookbookUrl);

    for (const name of names) {
      await addRecipeToCookbook(page, name);
    }

    await page.getByRole("button", { name: "Resort All" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Resort All" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const titles = await recipeCardTitles(page);
    expectPrefixOrder(titles, ARTICLE_STRIPPED_ORDER);
  });

  test("should sort a single chapter by title, leaving other chapters unchanged", async ({ page }) => {
    test.slow(); // creates 2 chapters and 6 recipes across several navigations
    await registerAndLogin(page);

    const names = await createRecipes(page, ["The Zebra", "Apple", "Yellow", "A Banana"]);

    const { cookbookUrl } = await createCookbook(page, getUniqueCookbookName("Sort Chapter E2E"));
    await gotoAndWaitForHydration(page, cookbookUrl);

    // The chapter section (and its heading) only renders once the cookbook has at
    // least one recipe, so add one before any chapter exists (creating the first
    // chapter migrates it in automatically) to get the heading to render immediately.
    await addRecipeToCookbook(page, names[0]);
    await createChapter(page, 1);
    await hoverChapterAndClickAction(page, 1, "Rename");
    await page.getByRole("textbox", { name: "Chapter name" }).fill("First Chapter");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("heading", { name: "First Chapter" })).toBeVisible({ timeout: 20000 });

    for (const name of names.slice(1)) {
      await addRecipeToCookbook(page, name, { chapterName: "First Chapter" });
    }

    await createChapter(page, 2);
    await hoverChapterAndClickAction(page, 2, "Rename");
    await page.getByRole("textbox", { name: "Chapter name" }).fill("Second Chapter");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("heading", { name: "Second Chapter" })).toBeVisible({ timeout: 20000 });

    const secondChapterNames = await createRecipes(page, ["Cherry", "Banana"]);
    await gotoAndWaitForHydration(page, cookbookUrl);
    await expect(page.getByLabel(/Sort Second Chapter recipes by title/)).toBeVisible({ timeout: 20000 });
    for (const name of secondChapterNames) {
      await addRecipeToCookbook(page, name, { chapterName: "Second Chapter" });
    }

    const firstChapterSection = page
      .locator('[data-testid^="chapter-section-"]')
      .filter({ has: page.getByRole("heading", { name: "First Chapter" }) });
    const secondChapterSection = page
      .locator('[data-testid^="chapter-section-"]')
      .filter({ has: page.getByRole("heading", { name: "Second Chapter" }) });

    const secondChapterTitlesBefore = await recipeCardTitles(secondChapterSection);

    await firstChapterSection.getByRole("heading", { name: "First Chapter" }).hover();
    await page.getByLabel("Sort First Chapter recipes by title").click({ force: true });
    await page.getByRole("dialog").getByRole("button", { name: "Sort Chapter" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Creating the first chapter migrates any pre-existing unchaptered recipe
    // (names[0]) into it, so First Chapter ends up with all four recipes.
    const firstChapterTitlesAfter = await recipeCardTitles(firstChapterSection);
    expectPrefixOrder(firstChapterTitlesAfter, ARTICLE_STRIPPED_ORDER);

    // Second Chapter must be untouched by the First Chapter sort.
    const secondChapterTitlesAfter = await recipeCardTitles(secondChapterSection);
    expect(secondChapterTitlesAfter).toEqual(secondChapterTitlesBefore);
  });
});
