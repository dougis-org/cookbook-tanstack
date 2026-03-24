import { test, expect, type Page } from "@playwright/test";
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

    // Create a recipe to add to the cookbook
    const recipeName = getUniqueRecipeName("Drag Hidden Logged Out");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: recipeName });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Create cookbook and add the recipe
    const cookbookName = getUniqueCookbookName("Drag Hidden Logged Out");
    const cookbookUrl = await createCookbook(page, cookbookName);
    await page.getByRole("button", { name: "Add Recipe" }).click();
    await page.getByRole("dialog").getByPlaceholder("Search recipes…").fill(recipeName);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: recipeName }).click();
    await page.waitForLoadState("networkidle");

    // Log out and revisit
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

    // Create a recipe as user A
    const recipeName = getUniqueRecipeName("Drag Hidden Non-Owner");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: recipeName });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Create cookbook and add the recipe as user A
    const cookbookName = getUniqueCookbookName("Drag Hidden Non-Owner");
    const cookbookUrl = await createCookbook(page, cookbookName);
    await page.getByRole("button", { name: "Add Recipe" }).click();
    await page.getByRole("dialog").getByPlaceholder("Search recipes…").fill(recipeName);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: recipeName }).click();
    await page.waitForLoadState("networkidle");

    // Login as user B
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

    // Create a recipe to add to the cookbook
    const recipeName = getUniqueRecipeName("Drag Visible Owner");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: recipeName });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Create cookbook and add the recipe
    const cookbookName = getUniqueCookbookName("Drag Visible Owner");
    await createCookbook(page, cookbookName);
    await page.getByRole("button", { name: "Add Recipe" }).click();
    await page.getByRole("dialog").getByPlaceholder("Search recipes…").fill(recipeName);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: recipeName }).click();
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: "Drag to reorder" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Remove/ })).toBeVisible();
  });
});
