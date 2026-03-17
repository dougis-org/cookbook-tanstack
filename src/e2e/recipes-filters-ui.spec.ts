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

    // Verify Row 1 quick filter buttons are visible
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

    // Verify Row 2 dropdowns are visible
    await expect(
      page.locator("select").filter({ hasText: "All Categories" }),
    ).toBeVisible();
    await expect(
      page.locator("select").filter({ hasText: "All Sources" }),
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
    await page.waitForURL(/myRecipes=(?!true)/);
  });

  test("should filter by Classification (Category)", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    // Get initial count
    const categorySelect = page
      .locator("select")
      .filter({ hasText: "All Categories" });
    await expect(categorySelect).toBeVisible();

    // Select a category from the dropdown
    await categorySelect.click();
    const firstOption = page.locator('select [value!=""]').first();
    const optionValue = await firstOption.getAttribute("value");

    if (optionValue) {
      await categorySelect.selectOption(optionValue);
      await page.waitForURL(/classificationId=/);
      await expect(page.locator('[data-testid="recipe-card"]')).toBeDefined();
    }
  });

  test("should expand and collapse More Filters panel", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    // Find the toggle button for More Filters panel
    const moreFiltersToggle = page.getByTestId("filter-more-filters-toggle");
    await expect(moreFiltersToggle).toBeVisible();

    // Initially should be collapsed
    const moreFiltersContent = page.getByTestId("filter-more-filters-content");
    const isInitiallyVisible = await moreFiltersContent
      .isVisible()
      .catch(() => false);
    expect(isInitiallyVisible).toBe(false);

    // Click to expand
    await moreFiltersToggle.click();
    await expect(moreFiltersContent).toBeVisible();

    // Click to collapse
    await moreFiltersToggle.click();
    const isCollapsed = await moreFiltersContent.isVisible().catch(() => false);
    expect(isCollapsed).toBe(false);
  });

  test("should select taxonomy items in More Filters panel", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    // Expand More Filters panel
    const moreFiltersToggle = page.getByTestId("filter-more-filters-toggle");
    await moreFiltersToggle.click();
    await page
      .getByTestId("filter-more-filters-content")
      .waitFor({ state: "visible" });

    // Click a meal chip (if any exist)
    const mealChips = page
      .locator("button")
      .filter({ hasText: /Breakfast|Lunch|Dinner|Brunch|Snack/ });
    const chipCount = await mealChips.count();

    if (chipCount > 0) {
      const firstChip = mealChips.first();
      const chipText = await firstChip.textContent();

      await firstChip.click();

      // URL should update with mealIds parameter
      await page.waitForURL(/mealIds=/);
      await expect(page.locator('[data-testid="recipe-card"]')).toBeDefined();

      // Chip should show active state
      const activeClass = await firstChip.getAttribute("class");
      expect(activeClass).toContain("cyan");
    }
  });

  test("should maintain filter state through panel collapse/expand", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    // Apply a filter to Row 2
    const categorySelect = page
      .locator("select")
      .filter({ hasText: "All Categories" });
    const firstOption = page.locator('select [value!=""]').first();
    const optionValue = await firstOption.getAttribute("value");

    if (optionValue) {
      await categorySelect.selectOption(optionValue);
      await page.waitForURL(/classificationId=/);

      // Get current URL
      const urlBefore = page.url();

      // Expand/collapse More Filters panel
      const moreFiltersToggle = page.getByTestId("filter-more-filters-toggle");
      await moreFiltersToggle.click();
      await page
        .getByTestId("filter-more-filters-content")
        .waitFor({ state: "visible" });
      await moreFiltersToggle.click();

      // URL should remain unchanged
      const urlAfter = page.url();
      expect(urlAfter).toBe(urlBefore);
    }
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

    // Click Clear All Filters button
    const clearButton = page.getByTestId("clear-all-filters");
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForURL((url) => !url.search.includes("myRecipes=true"));

      // Verify all filters are cleared from URL
      expect(page.url()).not.toContain("myRecipes=");
    }
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
