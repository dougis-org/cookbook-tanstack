import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers/auth"
import { createRecipeViaUI, getUniqueRecipeName } from "./helpers/recipes"

test.describe("Recipe List — Search, Sort, Filter, Paginate", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test("should search recipes by name", async ({ page }) => {
    await registerAndLogin(page)

    // Create a recipe with a unique searchable name
    const uniqueWord = `Searchable${Date.now()}`
    const recipeName = `${uniqueWord} Pasta`
    await page.goto("/recipes/new")
    await createRecipeViaUI(page, { name: recipeName })
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)

    // Navigate to recipe list and search
    await page.goto("/recipes")
    const searchInput = page.getByPlaceholder("Search recipes...")
    await searchInput.fill(uniqueWord)

    // Wait for debounce (300ms) + URL update
    await page.waitForURL(/search=/)

    // Verify the recipe appears in results
    await expect(page.getByText(recipeName)).toBeVisible()
  })

  test("should show no results for unmatched search", async ({ page }) => {
    await page.goto("/recipes")

    const searchInput = page.getByPlaceholder("Search recipes...")
    await searchInput.fill(`NoMatchXYZ${Date.now()}`)

    // Wait for debounce + URL update
    await page.waitForURL(/search=/)

    await expect(page.getByText("No recipes found")).toBeVisible()
  })

  test("should change sort order and update URL", async ({ page }) => {
    await page.goto("/recipes")

    const sortSelect = page.locator("select").first()

    // Change to Name A-Z
    await sortSelect.selectOption("name_asc")
    await expect(page).toHaveURL(/sort=name_asc/)

    // Change to Oldest first
    await sortSelect.selectOption("oldest")
    await expect(page).toHaveURL(/sort=oldest/)

    // Change to Name Z-A
    await sortSelect.selectOption("name_desc")
    await expect(page).toHaveURL(/sort=name_desc/)
  })

  test("should filter by taxonomy chips and show active state", async ({
    page,
  }) => {
    await page.goto("/recipes")

    // Find a filter chip (if taxonomy data is seeded)
    const mealChips = page
      .locator(".flex.flex-wrap.gap-3")
      .locator("button")
      .filter({ hasNotText: /Clear|New|Create/ })
    const chipCount = await mealChips.count()

    if (chipCount > 0) {
      const firstChip = mealChips.first()
      const chipText = await firstChip.textContent()

      // Click to activate filter
      await firstChip.click()

      // Verify active state styling (cyan border)
      await expect(firstChip).toHaveClass(/border-cyan-500/)

      // Click again to deactivate
      await firstChip.click()

      // Verify it's no longer active
      await expect(firstChip).not.toHaveClass(/border-cyan-500/)

      // If chip text is available, verify it was clickable
      expect(chipText).toBeTruthy()
    }
  })

  test("should clear all filters", async ({ page }) => {
    await page.goto("/recipes")

    // Activate a filter chip if any exist
    const filterChips = page
      .locator(".flex.flex-wrap.gap-3")
      .locator("button")
      .filter({ hasNotText: /Clear/ })
    const chipCount = await filterChips.count()

    if (chipCount > 0) {
      await filterChips.first().click()

      // "Clear all" button should appear
      const clearButton = page.getByRole("button", { name: /Clear all/ })
      await expect(clearButton).toBeVisible()

      // Click clear all
      await clearButton.click()

      // Clear all button should disappear
      await expect(clearButton).not.toBeVisible()
    }
  })

  test("should display pagination when enough recipes exist", async ({
    page,
  }) => {
    await page.goto("/recipes")

    // Check if pagination is present (depends on data volume)
    const paginationText = page.getByText(/^Page \d+ of \d+$/)
    const hasPagination = (await paginationText.count()) > 0

    if (hasPagination) {
      await expect(paginationText).toBeVisible()

      // Verify navigation buttons exist within the pagination container
      const paginationControls = page.getByText(/^Page \d+ of \d+$/).locator("..")
      const prevButton = paginationControls.locator("button").first()
      const nextButton = paginationControls.locator("button").last()

      // At least one pagination button should be visible
      expect(
        (await prevButton.isVisible()) || (await nextButton.isVisible()),
      ).toBeTruthy()
    }
  })
})
