import { test, expect, type Page } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

function getUniqueCookbookName(prefix = "Test Cookbook") {
  return `${prefix} ${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

/** Create a cookbook via the UI and return the detail page URL. */
async function createCookbook(page: Page, cookbookName: string): Promise<string> {
  await gotoAndWaitForHydration(page, "/cookbooks");
  await page.getByRole("button", { name: "New Cookbook" }).click();
  await page.getByPlaceholder("My Cookbook").fill(cookbookName);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.getByText(cookbookName).first().click();
  await page.waitForURL(/\/cookbooks\/[a-f0-9-]+$/);
  return page.url();
}

/**
 * Create a recipe, then a cookbook, then add the recipe to the cookbook.
 * Returns the cookbook URL and names for use in assertions.
 * Assumes the user is already logged in.
 */
async function createCookbookWithRecipe(
  page: Page,
  label: string,
): Promise<{ cookbookUrl: string; cookbookName: string; recipeName: string }> {
  const recipeName = getUniqueRecipeName(label);
  await gotoAndWaitForHydration(page, "/recipes/new");
  await submitRecipeForm(page, { name: recipeName });
  await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

  const cookbookName = getUniqueCookbookName(label);
  const cookbookUrl = await createCookbook(page, cookbookName);

  await page.getByRole("button", { name: "Add Recipe" }).click();
  await page
    .getByRole("dialog")
    .getByPlaceholder("Search recipes…")
    .fill(recipeName);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: recipeName }).click();
  await page.waitForLoadState("networkidle");

  return { cookbookUrl, cookbookName, recipeName };
}

test.describe("Cookbook Detail Owner Controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ─── Edit and Delete buttons ───────────────────────────────────────────────

  test("should hide Edit and Delete buttons when logged out", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Edit Delete Logged Out");
    const cookbookUrl = await createCookbook(page, cookbookName);

    await page.context().clearCookies();
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete" }),
    ).not.toBeVisible();
  });

  test("should hide Edit and Delete buttons for non-owner", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Edit Delete Non-Owner");
    const cookbookUrl = await createCookbook(page, cookbookName);

    await page.context().clearCookies();
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete" }),
    ).not.toBeVisible();
  });

  test("should show Edit and Delete buttons for owner", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Edit Delete Owner");
    await createCookbook(page, cookbookName);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  // ─── Add Recipe button ─────────────────────────────────────────────────────

  test("should hide Add Recipe button when logged out", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Add Recipe Logged Out");
    const cookbookUrl = await createCookbook(page, cookbookName);

    await page.context().clearCookies();
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Recipe" }),
    ).not.toBeVisible();
  });

  test("should hide Add Recipe button for non-owner", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Add Recipe Non-Owner");
    const cookbookUrl = await createCookbook(page, cookbookName);

    await page.context().clearCookies();
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Recipe" }),
    ).not.toBeVisible();
  });

  test("should show Add Recipe button for owner", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Add Recipe Owner");
    await createCookbook(page, cookbookName);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: "Add Recipe" }),
    ).toBeVisible();
  });

  // ─── Drag handle and Remove button ────────────────────────────────────────

  test("should hide drag handle and Remove button when logged out", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const { cookbookUrl, cookbookName } = await createCookbookWithRecipe(
      page,
      "Drag Hidden Logged Out",
    );

    await page.context().clearCookies();
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Drag to reorder" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /Remove/ }),
    ).not.toBeVisible();
  });

  test("should hide drag handle and Remove button for non-owner", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const { cookbookUrl, cookbookName } = await createCookbookWithRecipe(
      page,
      "Drag Hidden Non-Owner",
    );

    await page.context().clearCookies();
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Drag to reorder" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /Remove/ }),
    ).not.toBeVisible();
  });

  test("should show drag handle and Remove button for owner", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await createCookbookWithRecipe(page, "Drag Visible Owner");

    await expect(
      page.getByRole("button", { name: "Drag to reorder" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Remove/ })).toBeVisible();
  });
});

test.describe("Cookbook Chapters", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ─── Chapter creation and rename ─────────────────────────────────────────

  test("should create a chapter and rename it", async ({ page }) => {
    await registerAndLogin(page);
    const { cookbookUrl } = await createCookbookWithRecipe(
      page,
      "Chapters Create Rename",
    );
    await gotoAndWaitForHydration(page, cookbookUrl);

    // Create first chapter — chapter header appears once there are recipes
    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(page.getByRole("heading", { name: "Chapter 1" })).toBeVisible({ timeout: 20000 });

    // Hover to reveal owner icons, then click rename
    await page.getByRole("heading", { name: "Chapter 1" }).hover();
    await page.getByLabel(/Rename Chapter 1/).click({ force: true });
    await expect(page.getByRole("textbox", { name: "Chapter name" })).toBeVisible();
    await page.getByRole("textbox", { name: "Chapter name" }).fill("Starters");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("heading", { name: "Starters" })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole("heading", { name: "Chapter 1" })).not.toBeVisible();
  });

  test("should show New Chapter button only for owner", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Chapters Owner Only");
    const cookbookUrl = await createCookbook(page, cookbookName);

    await expect(page.getByRole("button", { name: "New Chapter" })).toBeVisible();

    // Non-owner should not see it
    await page.context().clearCookies();
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, cookbookUrl);
    await expect(page.getByRole("button", { name: "New Chapter" })).not.toBeVisible();
  });

  // ─── Chapter deletion (last chapter → unchaptered) ───────────────────────

  test("should delete last chapter and unchapter all recipes", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const { cookbookUrl, recipeName } = await createCookbookWithRecipe(
      page,
      "Chapters Delete Last",
    );
    await gotoAndWaitForHydration(page, cookbookUrl);

    // Create a chapter (migrates existing recipe into it)
    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(page.getByRole("heading", { name: "Chapter 1" })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(recipeName)).toBeVisible();

    // Hover to reveal delete icon, then delete the only chapter
    await page.getByRole("heading", { name: "Chapter 1" }).hover();
    await page.getByLabel(/Delete Chapter 1/).click({ force: true });
    // Confirm deletion in the modal
    await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    // Use heading role to avoid strict-mode violation with modal body text during mutation
    await expect(page.getByRole("heading", { name: "Chapter 1" })).not.toBeVisible({ timeout: 20000 });
    await expect(page.getByText(recipeName)).toBeVisible();
  });

  // ─── Cross-chapter recipe drag ───────────────────────────────────────────

  test("should show drag handles for recipes within chapters", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const { cookbookUrl } = await createCookbookWithRecipe(
      page,
      "Cross Chapter Drag",
    );
    await gotoAndWaitForHydration(page, cookbookUrl);

    // Create a chapter — recipe migrates into it
    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(page.getByRole("heading", { name: "Chapter 1" })).toBeVisible({ timeout: 20000 });

    // Recipe drag handle should still be visible within the chapter
    await expect(
      page.getByRole("button", { name: "Drag to reorder" }),
    ).toBeVisible();
  });

  // ─── Chapter-sort (collapsed mode) ───────────────────────────────────────

  test("should toggle collapsed mode and show chapter rows", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const { cookbookUrl } = await createCookbookWithRecipe(
      page,
      "Chapters Collapse",
    );
    await gotoAndWaitForHydration(page, cookbookUrl);

    // Create two chapters (recipe migrates to Chapter 1, Chapter 2 starts empty)
    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(page.getByRole("heading", { name: "Chapter 1" })).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(page.getByRole("heading", { name: "Chapter 2" })).toBeVisible({ timeout: 20000 });

    // Collapse toggle appears once there are chapters
    const collapseBtn = page.getByRole("button", { name: /Collapse to chapter view|Expand recipe list/ });
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();

    // In collapsed mode both chapter rows remain visible
    await expect(page.getByText("Chapter 1")).toBeVisible();
    await expect(page.getByText("Chapter 2")).toBeVisible();
  });
});
