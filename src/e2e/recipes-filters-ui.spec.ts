import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { submitRecipeForm } from "./helpers/recipes";

test.describe("Recipe Filter UI — Unified Filter Dropdowns", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should display Row 1 (Quick Filters) correctly", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    await expect(
      page.getByRole("button", { name: /My Recipes/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Favorites/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Has Image/i }),
    ).toBeVisible();
  });

  test("should display all five dropdown filters", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    await expect(
      page.getByTestId("filter-dropdown-classification"),
    ).toBeVisible();
    await expect(page.getByTestId("filter-dropdown-source")).toBeVisible();
    await expect(page.getByTestId("filter-dropdown-meal")).toBeVisible();
    await expect(page.getByTestId("filter-dropdown-course")).toBeVisible();
    await expect(page.getByTestId("filter-dropdown-preparation")).toBeVisible();
  });

  test("should toggle My Recipes quick filter", async ({ page }) => {
    await registerAndLogin(page);

    // Create a recipe so we have data to filter
    const recipeName = `MyRecipe${Date.now()}`;
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: recipeName });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Go to recipes list
    await gotoAndWaitForHydration(page, "/recipes");
    const recipeCount1 = await page
      .locator('[data-testid="recipe-card"]')
      .count();

    // Click "My Recipes" filter
    const myRecipesButton = page
      .getByRole("button", { name: /My Recipes/i })
      .first();
    await myRecipesButton.click();

    // Wait for URL to update and recipes to filter
    await page.waitForURL(/myRecipes=true/);
    const recipeCount2 = await page
      .locator('[data-testid="recipe-card"]')
      .count();

    // Should show filtered results (possibly same or fewer)
    expect(recipeCount2).toBeLessThanOrEqual(recipeCount1);

    // Toggle off
    await myRecipesButton.click();
    await expect(page).not.toHaveURL(/myRecipes=true/);
  });

  test("should filter by Classification (Category)", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    const categoryDropdown = page.getByTestId("filter-dropdown-classification");
    await expect(categoryDropdown).toBeVisible();

    // Open the multi-select dropdown
    await categoryDropdown.getByRole("button").click();

    // Classifications are user-created (not seeded), so checkboxes may not exist in CI
    const firstCheckbox = categoryDropdown.getByRole("checkbox").first();
    const hasOptions = await firstCheckbox
      .waitFor({ state: "attached", timeout: 5000 })
      .catch(() => null);
    if (!hasOptions) return;

    await firstCheckbox.click();
    await page.waitForURL(/classificationIds=/);
  });

  test("should filter by Meal type using dropdown", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    const mealDropdown = page.getByTestId("filter-dropdown-meal");
    await expect(mealDropdown).toBeVisible();

    // Open the meal dropdown
    await mealDropdown.getByRole("button").click();

    // Meal taxonomy is seeded by npm run db:seed
    const firstCheckbox = mealDropdown.getByRole("checkbox").first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.click();

    await page.waitForURL(/mealIds=/);

    // Meal dropdown button should reflect the selection (active styling)
    const mealButton = mealDropdown.getByRole("button");
    const classList = await mealButton.getAttribute("class");
    expect(classList).toContain("cyan");
  });

  test("should maintain filter state when applying multiple filters", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    const categoryDropdown = page.getByTestId("filter-dropdown-classification");

    // Open the multi-select dropdown
    await categoryDropdown.getByRole("button").click();

    // Classifications are user-created (not seeded), so checkboxes may not exist in CI
    const firstCheckbox = categoryDropdown.getByRole("checkbox").first();
    const hasOptions = await firstCheckbox
      .waitFor({ state: "attached", timeout: 5000 })
      .catch(() => null);
    if (!hasOptions) return;

    await firstCheckbox.click();
    await page.waitForURL(/classificationIds=/);

    const urlWithFilter = page.url();

    // Apply a quick filter on top — classification filter should remain
    const hasImageButton = page
      .getByRole("button", { name: /Has Image/i })
      .first();
    await hasImageButton.click();
    await page.waitForURL(/hasImage=true/);

    expect(page.url()).toContain("classificationIds=");
    expect(page.url()).toContain("hasImage=true");

    // Remove the quick filter — classification should still be there
    await hasImageButton.click();
    await page.waitForURL((url) => !url.search.includes("hasImage=true"));

    expect(page.url()).toContain("classificationIds=");
    expect(page.url()).not.toContain("hasImage=");

    void urlWithFilter; // referenced for intent clarity
  });

  test("should clear all filters button reset all filters", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    // Apply multiple filters
    const myRecipesButton = page
      .getByRole("button", { name: /My Recipes/i })
      .first();
    await myRecipesButton.click();
    await page.waitForURL(/myRecipes=true/);

    // Verify URL has filter params
    expect(page.url()).toContain("myRecipes=true");

    // Clear All Filters button appears when filters are active
    const clearButton = page.getByTestId("clear-all-filters");
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await page.waitForURL((url) => !url.search.includes("myRecipes=true"));
    expect(page.url()).not.toContain("myRecipes=");
  });

  test("should display active filter badges", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    // Apply a quick filter
    const hasImageButton = page
      .getByRole("button", { name: /Has Image/i })
      .first();
    await hasImageButton.click();
    await page.waitForURL(/hasImage=true/);

    // Look for active filter badge (should display "Has Image")
    const badge = page.locator("span").filter({ hasText: "Has Image" });
    await expect(badge).toBeVisible();
  });

  test("should work on mobile (responsive)", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    // Verify filter components are still visible and clickable
    const myRecipesButton = page
      .getByRole("button", { name: /My Recipes/i })
      .first();
    await expect(myRecipesButton).toBeVisible();

    // Should be able to click filters on mobile
    await myRecipesButton.click();
    await page.waitForURL(/myRecipes=true/);

    // All five dropdowns should still be accessible on mobile
    await expect(page.getByTestId("filter-dropdown-meal")).toBeVisible();
    await expect(page.getByTestId("filter-dropdown-course")).toBeVisible();
    await expect(page.getByTestId("filter-dropdown-preparation")).toBeVisible();
  });

  test("logged-out user should see only Has Image quick filter", async ({
    page,
  }) => {
    // Don't log in
    await gotoAndWaitForHydration(page, "/recipes");

    // Should see Has Image toggle
    await expect(
      page.getByRole("button", { name: /Has Image/i }),
    ).toBeVisible();

    // Should NOT see My Recipes or Favorites toggles
    const myRecipesButtons = page
      .locator("button")
      .filter({ hasText: /^My Recipes$/ });
    const favoritesButtons = page
      .locator("button")
      .filter({ hasText: /^Favorites$/ });
    expect(await myRecipesButtons.count()).toBe(0);
    expect(await favoritesButtons.count()).toBe(0);
  });
});
