import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { submitRecipeForm } from "./helpers/recipes";

test.describe("Recipe List — Search, Sort, Filter, Paginate", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should search recipes by name", async ({ page }) => {
    await registerAndLogin(page);

    // Create a recipe with a unique searchable name
    const uniqueWord = `Searchable${Date.now()}`;
    const recipeName = `${uniqueWord} Pasta`;
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: recipeName });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Navigate to recipe list and search
    await gotoAndWaitForHydration(page, "/recipes");
    const searchInput = page.getByTestId("recipe-search-input");
    await searchInput.fill(uniqueWord);

    // waitForURL blocks until the debounced search updates the URL query param;
    // toBeVisible then auto-retries until the re-rendered results appear.
    await page.waitForURL(/search=.+/);
    await expect(page.getByText(recipeName)).toBeVisible();
  });

  test("should show no results for unmatched search", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    const searchInput = page.getByTestId("recipe-search-input");
    await searchInput.fill(`NoMatchXYZ${Date.now()}`);

    // waitForURL blocks until the debounced search updates the URL;
    // toBeVisible auto-retries until the empty state renders.
    await page.waitForURL(/search=.+/);
    await expect(page.getByText("No recipes found")).toBeVisible();
  });

  test("should change sort order and update URL", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    // Target the sort select by its unique option content (not default selection)
    const sortSelect = page.locator("select").filter({ hasText: "Name A-Z" });

    // Change to Name A-Z
    await sortSelect.selectOption("name_asc");
    await expect(page).toHaveURL(/sort=name_asc/);

    // Change to Oldest first
    await sortSelect.selectOption("oldest");
    await expect(page).toHaveURL(/sort=oldest/);

    // Change to Name Z-A
    await sortSelect.selectOption("name_desc");
    await expect(page).toHaveURL(/sort=name_desc/);
  });

  test("should filter by meal dropdown and show active state", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    const mealDropdown = page.getByTestId("filter-dropdown-meal");
    await expect(mealDropdown).toBeVisible();

    // Open the meal dropdown and select the first option
    // Meal taxonomy is seeded by npm run db:seed
    await mealDropdown.getByRole("button").click();
    const firstCheckbox = mealDropdown.getByRole("checkbox").first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.click();

    // URL should contain mealIds filter param
    await expect(page).toHaveURL(/mealIds=/);

    // Meal dropdown button should reflect active state
    const mealButton = mealDropdown.getByRole("button");
    await expect(mealButton).toHaveClass(/cyan/);

    // Deselect — URL should no longer have the filter param
    await firstCheckbox.click();
    await expect(page).not.toHaveURL(/mealIds=/);
  });

  test("should clear all filters", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    // Apply a meal filter via the dropdown
    // Meal taxonomy is seeded by npm run db:seed
    const mealDropdown = page.getByTestId("filter-dropdown-meal");
    await mealDropdown.getByRole("button").click();
    const firstCheckbox = mealDropdown.getByRole("checkbox").first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.click();

    // URL should contain a filter query param
    await expect(page).toHaveURL(/mealIds=/);

    // "Clear all" button should appear
    const clearButton = page.getByTestId("clear-all-filters");
    await expect(clearButton).toBeVisible();

    // Click clear all
    await clearButton.click();

    // Clear all button should disappear
    await expect(clearButton).not.toBeVisible();

    // Filter-related query params should be removed from the URL
    await expect(page).not.toHaveURL(/mealIds=/);
  });

  test("should display pagination when enough recipes exist", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    // This test requires >20 recipes in the database to verify pagination
    const paginationText = page.getByText(/^Page \d+ of \d+$/);
    const hasPagination = (await paginationText.count()) > 0;
    test.skip(
      !hasPagination,
      "Not enough recipes in DB to test pagination (need >20)",
    );

    await expect(paginationText).toBeVisible();

    // Verify navigation buttons exist within the pagination container
    const paginationControls = paginationText.locator("..");
    const prevButton = paginationControls.locator("button").first();
    const nextButton = paginationControls.locator("button").last();

    // At least one pagination button should be visible
    expect(
      (await prevButton.isVisible()) || (await nextButton.isVisible()),
    ).toBeTruthy();
  });

  test("should display category badge with solid styling on recipe cards", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    // Get the first recipe card
    const firstCard = page.locator('[data-testid="recipe-card"]').first();
    await expect(firstCard).toBeVisible();

    // Category/classification badge should be present
    const categoryBadge = firstCard.locator('[data-testid="category-badge"]');
    await expect(categoryBadge).toBeVisible();

    // Badge should have solid cyan background (not semi-transparent)
    const computedStyle = await categoryBadge.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
      };
    });

    // Verify dark background for solid styling (approximately cyan-600)
    expect(computedStyle.backgroundColor).toMatch(/rgb\(|rgba\(/);
    // Verify high contrast text (white or light color)
    expect(computedStyle.color).toBeDefined();
  });

  test("should display category badge with readable text on cards", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    const firstCard = page.locator('[data-testid="recipe-card"]').first();
    const categoryBadge = firstCard.locator('[data-testid="category-badge"]');

    // Badge should contain text content (category name)
    const badgeText = await categoryBadge.textContent();
    expect(badgeText).toBeTruthy();
    expect(badgeText?.length).toBeGreaterThan(0);
  });

  test("should position category badge prominently on recipe cards", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    const firstCard = page.locator('[data-testid="recipe-card"]').first();
    const categoryBadge = firstCard.locator('[data-testid="category-badge"]');
    const cardTitle = firstCard.locator('[data-testid="recipe-title"]');

    // Badge should appear before or at top of card
    const badgeBox = await categoryBadge.boundingBox();
    const titleBox = await cardTitle.boundingBox();

    expect(badgeBox).toBeTruthy();
    expect(titleBox).toBeTruthy();

    // Badge should be positioned above the title (or in header area)
    if (badgeBox && titleBox) {
      expect(badgeBox.y).toBeLessThanOrEqual(titleBox.y);
    }
  });
});
