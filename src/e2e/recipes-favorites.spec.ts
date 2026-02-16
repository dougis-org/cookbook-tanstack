import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers/auth"
import { createRecipeViaUI, getUniqueRecipeName } from "./helpers/recipes"

test.describe("Recipe Favorites", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test("should toggle favorite on and off", async ({ page }) => {
    await registerAndLogin(page)

    // Create a recipe so we have one to favorite
    const recipeName = getUniqueRecipeName("Fave Test")
    await page.goto("/recipes/new")
    await createRecipeViaUI(page, { name: recipeName })
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)

    // The Save button should be visible for logged-in users
    const saveButton = page.getByRole("button", { name: /^Save$/ })
    await expect(saveButton).toBeVisible()

    // Click to mark as favorite
    await saveButton.click()

    // Should now show "Saved" with filled heart
    const savedButton = page.getByRole("button", { name: /^Saved$/ })
    await expect(savedButton).toBeVisible()

    // Verify the heart icon has the filled style (fill-red-500)
    const heartIcon = savedButton.locator("svg")
    await expect(heartIcon).toHaveClass(/fill-red-500/)

    // Click again to unmark
    await savedButton.click()

    // Should revert back to "Save"
    await expect(
      page.getByRole("button", { name: /^Save$/ }),
    ).toBeVisible()
  })

  test("should not show Save button when logged out", async ({ page }) => {
    // First create a recipe while logged in
    await registerAndLogin(page)
    const recipeName = getUniqueRecipeName("No Fave Button")
    await page.goto("/recipes/new")
    await createRecipeViaUI(page, { name: recipeName })
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)
    const recipeUrl = page.url()

    // Log out by clearing cookies and revisiting
    await page.context().clearCookies()
    await page.goto(recipeUrl)

    // Wait for the page to load
    await expect(
      page.getByRole("heading", { name: recipeName }),
    ).toBeVisible()

    // Save button should NOT be visible
    await expect(
      page.getByRole("button", { name: /^Save$/ }),
    ).not.toBeVisible()
    await expect(
      page.getByRole("button", { name: /^Saved$/ }),
    ).not.toBeVisible()
  })
})
