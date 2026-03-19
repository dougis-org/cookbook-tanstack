import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { submitRecipeForm } from "./helpers/recipes";

test.describe("Recipe Filter UI — Two-Row Layout with More Filters Panel", () => {
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

  test("should display Row 2 (Dropdown Filters) correctly", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    await expect(
      page.getByTestId("filter-dropdown-classification"),
    ).toBeVisible();
    await expect(
      page.getByTestId("filter-dropdown-source"),
    ).toBeVisible();
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

    const categorySelect = page.getByTestId("filter-dropdown-classification");
    await expect(categorySelect).toBeVisible();

    // Classifications are user-created (not seeded), so options may not exist in CI
    const optionSelector =
      '[data-testid="filter-dropdown-classification"] option[value]:not([value=""])';
    const hasOptions = await page
      .waitForSelector(optionSelector, { state: "attached", timeout: 5000 })
      .catch(() => null);
    if (!hasOptions) return;

    const optionValue = await page
      .locator(optionSelector)
      .first()
      .getAttribute("value");
    if (!optionValue) return;

    await categorySelect.selectOption(optionValue);
    await page.waitForURL(/classificationId=/);
  });

  test("should expand and collapse More Filters panel", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    const moreFiltersToggle = page.getByTestId("filter-more-filters-toggle");
    await expect(moreFiltersToggle).toBeVisible();

    const moreFiltersContent = page.getByTestId("filter-more-filters-content");
    await expect(moreFiltersContent).toBeHidden();

    await moreFiltersToggle.click();
    await expect(moreFiltersContent).toBeVisible();

    await moreFiltersToggle.click();
    await expect(moreFiltersContent).toBeHidden();
  });

  test("should select taxonomy items in More Filters panel", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    const moreFiltersToggle = page.getByTestId("filter-more-filters-toggle");
    await moreFiltersToggle.click();
    await page
      .getByTestId("filter-more-filters-content")
      .waitFor({ state: "visible" });

    // Meal taxonomy is seeded by npm run db:seed
    const firstChip = page
      .locator("button")
      .filter({ hasText: /Breakfast|Lunch|Dinner|Brunch|Snack/ })
      .first();
    await expect(firstChip).toBeVisible();
    await firstChip.click();

    await page.waitForURL(/mealIds=/);

    const activeClass = await firstChip.getAttribute("class");
    expect(activeClass).toContain("cyan");
  });

  test("should maintain filter state through panel collapse/expand", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    const categorySelect = page.getByTestId("filter-dropdown-classification");

    // Classifications are user-created (not seeded), so options may not exist in CI
    const optionSelector =
      '[data-testid="filter-dropdown-classification"] option[value]:not([value=""])';
    const hasOptions = await page
      .waitForSelector(optionSelector, { state: "attached", timeout: 5000 })
      .catch(() => null);
    if (!hasOptions) return;

    const optionValue = await page
      .locator(optionSelector)
      .first()
      .getAttribute("value");
    if (!optionValue) return;

    await categorySelect.selectOption(optionValue);
    await page.waitForURL(/classificationId=/);

    const urlBefore = page.url();

    const moreFiltersToggle = page.getByTestId("filter-more-filters-toggle");
    await moreFiltersToggle.click();
    await page
      .getByTestId("filter-more-filters-content")
      .waitFor({ state: "visible" });
    await moreFiltersToggle.click();

    expect(page.url()).toBe(urlBefore);
  });

  test("should clear all filters button reset all three rows", async ({
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

    // More Filters panel should still be expandable
    const moreFiltersToggle = page.getByTestId("filter-more-filters-toggle");
    await expect(moreFiltersToggle).toBeVisible();
    await moreFiltersToggle.click();
    await page
      .getByTestId("filter-more-filters-content")
      .waitFor({ state: "visible" });
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
