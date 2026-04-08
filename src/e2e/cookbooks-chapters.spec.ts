import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import {
  addRecipeToCookbook,
  createCookbook,
  createCookbookWithRecipe,
  getUniqueCookbookName,
} from "./helpers/cookbooks";
import { getUniqueRecipeName, submitRecipeForm } from "./helpers/recipes";

test.describe("Cookbook Chapters", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should create a chapter and rename it", async ({ page }) => {
    await registerAndLogin(page);
    const { cookbookUrl } = await createCookbookWithRecipe(
      page,
      "Chapters Create Rename",
    );
    await gotoAndWaitForHydration(page, cookbookUrl);

    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(
      page.getByRole("button", { name: "New Chapter" }),
    ).toBeEnabled();
    await expect(page.getByRole("heading", { name: /Chapter 1/i })).toBeVisible(
      { timeout: 20000 },
    );

    await page.getByRole("heading", { name: /Chapter 1/i }).hover();
    await page.getByLabel(/Rename Chapter 1/).click({ force: true });
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
    await registerAndLogin(page);
    const { cookbookUrl, recipeName } = await createCookbookWithRecipe(
      page,
      "Chapters Delete Last",
    );
    await gotoAndWaitForHydration(page, cookbookUrl);

    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(
      page.getByRole("button", { name: "New Chapter" }),
    ).toBeEnabled();
    await expect(page.getByRole("heading", { name: /Chapter 1/i })).toBeVisible(
      { timeout: 20000 },
    );
    await expect(page.getByText(recipeName)).toBeVisible();

    await page.getByRole("heading", { name: /Chapter 1/i }).hover();
    await page.getByLabel(/Delete Chapter 1/).click({ force: true });
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
    await registerAndLogin(page);
    const { cookbookUrl } = await createCookbookWithRecipe(
      page,
      "Cross Chapter Drag",
    );
    await gotoAndWaitForHydration(page, cookbookUrl);

    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(
      page.getByRole("button", { name: "New Chapter" }),
    ).toBeEnabled();
    await expect(page.getByRole("heading", { name: /Chapter 1/i })).toBeVisible(
      { timeout: 20000 },
    );

    await expect(
      page.getByRole("button", { name: "Drag to reorder" }),
    ).toBeVisible();
  });

  test("should drag a recipe from a populated chapter into an empty chapter", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const { cookbookUrl, recipeName } = await createCookbookWithRecipe(
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

    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(
      page.getByRole("button", { name: "New Chapter" }),
    ).toBeEnabled();
    await expect(page.getByRole("heading", { name: /Chapter 1/i })).toBeVisible(
      { timeout: 20000 },
    );
    await expect(page.getByText(recipeName)).toBeVisible();
    await expect(page.getByText(recipe2Name)).toBeVisible();

    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(
      page.getByRole("button", { name: "New Chapter" }),
    ).toBeEnabled();
    await expect(page.getByRole("heading", { name: /Chapter 2/i })).toBeVisible(
      { timeout: 20000 },
    );
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
    await registerAndLogin(page);
    const { cookbookUrl } = await createCookbookWithRecipe(
      page,
      "Chapters Collapse",
    );
    await gotoAndWaitForHydration(page, cookbookUrl);

    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(
      page.getByRole("button", { name: "New Chapter" }),
    ).toBeEnabled();
    await expect(page.getByRole("heading", { name: /Chapter 1/i })).toBeVisible(
      { timeout: 20000 },
    );
    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(
      page.getByRole("button", { name: "New Chapter" }),
    ).toBeEnabled();
    await expect(page.getByRole("heading", { name: /Chapter 2/i })).toBeVisible(
      { timeout: 20000 },
    );

    const collapseBtn = page.getByRole("button", {
      name: /Collapse to chapter view|Expand recipe list/,
    });
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();

    await expect(page.getByText(/Chapter 1/i)).toBeVisible();
    await expect(page.getByText(/Chapter 2/i)).toBeVisible();
  });
});
