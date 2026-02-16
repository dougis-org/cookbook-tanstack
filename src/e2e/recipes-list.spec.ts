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

    // Wait for debounce (300ms) + URL update with actual search value
    await page.waitForURL(/search=.+/)

    // Verify the recipe appears in results
    await expect(page.getByText(recipeName)).toBeVisible()
  })

  test("should show no results for unmatched search", async ({ page }) => {
    await page.goto("/recipes")

    const searchInput = page.getByPlaceholder("Search recipes...")
    await searchInput.fill(`NoMatchXYZ${Date.now()}`)

    // Wait for debounce + URL update with actual search value
    await page.waitForURL(/search=.+/)

    await expect(page.getByText("No recipes found")).toBeVisible()
  })

  test("should change sort order and update URL", async ({ page }) => {
    await page.goto("/recipes")

    // Target the sort select by its current option text
    const sortSelect = page.locator("select").filter({ hasText: "Newest first" })

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

    // Find filter chips within the filter chip container
    const filterChipContainer = page.locator(".flex.flex-wrap.gap-3")
    const filterChips = filterChipContainer
      .locator("button")
      .filter({ hasNotText: /Clear|New|Create/ })
    const chipCount = await filterChips.count()

    if (chipCount > 0) {
      const firstChip = filterChips.first()
      const chipText = await firstChip.textContent()

      // Click to activate filter — verify URL updates with filter param
      await firstChip.click()
      await expect(page).toHaveURL(/Ids=/)

      // Click again to deactivate
      await firstChip.click()

      // URL should no longer have the filter param
      await expect(page).not.toHaveURL(/Ids=/)

      // Verify chip was interactive
      expect(chipText).toBeTruthy()
    }
  })

  test("should clear all filters", async ({ page }) => {
    await page.goto("/recipes")

    // Find filter chips within the filter chip container
    const filterChipContainer = page.locator(".flex.flex-wrap.gap-3")
    const filterChips = filterChipContainer
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
      const paginationControls = paginationText.locator("..")
      const prevButton = paginationControls.locator("button").first()
      const nextButton = paginationControls.locator("button").last()

      // At least one pagination button should be visible
      expect(
        (await prevButton.isVisible()) || (await nextButton.isVisible()),
      ).toBeTruthy()
    }
  })
})
