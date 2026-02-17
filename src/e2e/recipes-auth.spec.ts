import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers/auth"
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes"

test.describe("Recipe Auth-Gated Actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test("should redirect unauthenticated user from /recipes/new to login", async ({
    page,
  }) => {
    await page.goto("/recipes/new")
    await page.waitForURL(/\/auth\/login/)
  })

  test("should redirect unauthenticated user from /recipes/:id/edit to login", async ({
    page,
  }) => {
    // First create a recipe while logged in
    await registerAndLogin(page)
    const recipeName = getUniqueRecipeName("Auth Edit Test")
    await page.goto("/recipes/new")
    await submitRecipeForm(page, { name: recipeName })
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)

    // Extract the recipe URL and build edit URL
    const detailUrl = page.url()
    const editUrl = `${detailUrl}/edit`

    // Log out
    await page.context().clearCookies()

    // Try to access edit page
    await page.goto(editUrl)
    await page.waitForURL(/\/auth\/login/)
  })

  test("should not show New Recipe button on list page when logged out", async ({
    page,
  }) => {
    await page.goto("/recipes")

    // Wait for the page to be loaded
    await expect(
      page.getByRole("heading", { name: "Recipes" }),
    ).toBeVisible()

    // The sidebar nav always renders a "New Recipe" link (off-screen via CSS
    // transform, but Playwright considers it visible). The recipe list page
    // conditionally renders a second one only for authenticated users.
    // When logged out: only the sidebar link exists (count = 1).
    await expect(
      page.getByRole("link", { name: "New Recipe" }),
    ).toHaveCount(1)
  })

  test("should show New Recipe button on list page when logged in", async ({
    page,
  }) => {
    await registerAndLogin(page)
    await page.goto("/recipes")

    // When logged in: sidebar link + recipe list page link (count = 2)
    await expect(
      page.getByRole("link", { name: "New Recipe" }),
    ).toHaveCount(2)
  })

  test("should not show Edit/Delete buttons for unauthenticated user", async ({
    page,
  }) => {
    // Create a recipe while logged in
    await registerAndLogin(page)
    const recipeName = getUniqueRecipeName("Auth Buttons Test")
    await page.goto("/recipes/new")
    await submitRecipeForm(page, { name: recipeName })
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)
    const recipeUrl = page.url()

    // Log out and revisit
    await page.context().clearCookies()
    await page.goto(recipeUrl)

    await expect(
      page.getByRole("heading", { name: recipeName }),
    ).toBeVisible()

    // Edit and Delete buttons should NOT be visible
    await expect(
      page.getByRole("link", { name: "Edit Recipe" }),
    ).not.toBeVisible()
    await expect(
      page.getByRole("button", { name: "Delete Recipe" }),
    ).not.toBeVisible()
  })

  test("should not show Edit/Delete buttons for non-owner user", async ({
    page,
  }) => {
    // Create a recipe as user A
    await registerAndLogin(page)
    const recipeName = getUniqueRecipeName("Owner Only Test")
    await page.goto("/recipes/new")
    await submitRecipeForm(page, { name: recipeName })
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)
    const recipeUrl = page.url()

    // Log out and register as user B
    await page.context().clearCookies()
    await registerAndLogin(page)

    // Visit the recipe created by user A
    await page.goto(recipeUrl)

    await expect(
      page.getByRole("heading", { name: recipeName }),
    ).toBeVisible()

    // Edit and Delete buttons should NOT be visible for non-owner
    await expect(
      page.getByRole("link", { name: "Edit Recipe" }),
    ).not.toBeVisible()
    await expect(
      page.getByRole("button", { name: "Delete Recipe" }),
    ).not.toBeVisible()
  })

  test("should show Edit/Delete buttons for recipe owner", async ({
    page,
  }) => {
    await registerAndLogin(page)
    const recipeName = getUniqueRecipeName("Owner Buttons Test")
    await page.goto("/recipes/new")
    await submitRecipeForm(page, { name: recipeName })
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)

    // Owner should see Edit and Delete buttons
    await expect(
      page.getByRole("link", { name: "Edit Recipe" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Delete Recipe" }),
    ).toBeVisible()
  })
})
