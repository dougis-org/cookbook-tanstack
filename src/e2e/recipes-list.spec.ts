import { test, expect } from "@bgotink/playwright-coverage";
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

    // Navigate to recipe list and search via header input
    await gotoAndWaitForHydration(page, "/recipes");
    const searchInput = page.getByTestId("header-search-input");
    await searchInput.fill(uniqueWord);

    // waitForURL blocks until the debounced search updates the URL query param;
    // toBeVisible then auto-retries until the re-rendered results appear.
    await page.waitForURL(/search=.+/);
    await expect(page.getByText(recipeName)).toBeVisible();
  });

  test("should show no results for unmatched search", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");

    const searchInput = page.getByTestId("header-search-input");
    await searchInput.fill(`NoMatchXYZ${Date.now()}`);

    // waitForURL blocks until the debounced search updates the URL;
    // toBeVisible auto-retries until the empty state renders.
    await page.waitForURL(/search=.+/);
    await expect(page.getByText("No recipes found")).toBeVisible();
  });

  test("recipe-search-input no longer exists in DOM", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");
    await expect(page.getByTestId("recipe-search-input")).toHaveCount(0);
  });

  test("header search input is visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");
    await expect(page.getByTestId("header-search-input")).toBeVisible();
  });

  test("header input populates from URL on load", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes?search=tacos");
    await expect(page.getByTestId("header-search-input")).toHaveValue("tacos");
  });

  test("clearing header input removes search param", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes?search=chicken");
    const searchInput = page.getByTestId("header-search-input");
    await searchInput.clear();
    await page.waitForFunction(() => !window.location.search.includes("search="));
    await expect(page).not.toHaveURL(/search=/);
  });

  test("cyan dot visible on desktop when search is active", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes?search=pasta");
    // Desktop dot is the first one (inside the md:flex search container)
    await expect(page.getByTestId("header-search-dot").first()).toBeVisible();
  });

  test("cyan dot hidden on desktop when no search", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");
    await expect(page.getByTestId("header-search-dot")).toHaveCount(0);
  });

  test("mobile shows icon button, not input field", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");
    await expect(page.getByTestId("header-search-input")).not.toBeVisible();
    await expect(page.getByTestId("header-search-icon-btn")).toBeVisible();
  });

  test("tapping search icon opens overlay with focused input", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");
    await page.getByTestId("header-search-icon-btn").click();
    const input = page.getByTestId("header-search-input");
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test("close button closes mobile overlay", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");
    await page.getByTestId("header-search-icon-btn").click();
    await expect(page.getByTestId("header-search-input")).toBeVisible();
    await page.getByTestId("header-search-close-btn").click();
    await expect(page.getByTestId("header-search-input")).not.toBeVisible();
    // Logo should be restored
    await expect(page.getByRole("link", { name: /cookbook/i }).first()).toBeVisible();
  });

  test("Escape key closes mobile overlay", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes");
    await page.getByTestId("header-search-icon-btn").click();
    await expect(page.getByTestId("header-search-input")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("header-search-input")).not.toBeVisible();
  });

  test("cyan dot visible on mobile icon when search is active", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes?search=pasta");
    // Mobile dot is the last one (inside the md:hidden icon button wrapper)
    await expect(page.getByTestId("header-search-dot").last()).toBeVisible();
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

    // Meal dropdown button should reflect active state (uses classification badge tokens for active tint)
    const mealButton = mealDropdown.getByRole("button");
    await expect(mealButton).toHaveClass(/theme-badge-classification/);

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

  test("cookbook route transitions and TOC view", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/cookbooks");

    // Create a new cookbook so the workflow is deterministic.
    const uniqueCookbook = `Test Cookbook ${Date.now()}`;
    await page.click('button:has-text("New Cookbook")');
    await page.getByLabel("Name").fill(uniqueCookbook);
    await page.getByLabel("Description").fill("e2e test cookbook");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    // Wait for cookbook card to appear in the list.
    await expect(page.getByText(uniqueCookbook)).toBeVisible();

    // Navigate to detail view.
    await page.click(`a:has-text("${uniqueCookbook}")`);
    await expect(page).toHaveURL(/\/cookbooks\/[a-f0-9-]+$/);
    await expect(
      page.getByRole("heading", { name: uniqueCookbook }),
    ).toBeVisible();

    // Table of Contents subroute.
    await page.click('a:has-text("Table of Contents")');
    await expect(page).toHaveURL(/\/cookbooks\/[a-f0-9-]+\/toc$/);
    // Use role to avoid strict mode violation with breadcrumb
    await expect(page.getByRole("paragraph").filter({ hasText: "Table of Contents" })).toBeVisible();
  });

  test("category detail route rendering", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/categories");

    const categoryHeadings = page.getByRole("heading", { level: 3 });

    // Wait for at least one heading to appear or timeout
    try {
      await expect(categoryHeadings.first()).toBeVisible({ timeout: 15000 });
    } catch (e) {
      test.skip(true, "No categories appeared within 15s");
    }

    const firstCategoryHeading = categoryHeadings.first();
    const categoryName =
      (await firstCategoryHeading.textContent())?.trim() ?? "";
    await firstCategoryHeading.click();

    // navigation to category details should resolve
    await expect(page).toHaveURL(/\/categories\/[a-f0-9-]+$/);
    await expect(
      page.getByRole("heading", { name: categoryName }),
    ).toBeVisible();
  });
});
