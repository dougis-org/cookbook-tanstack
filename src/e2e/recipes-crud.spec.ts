import { test, expect } from "@playwright/test"
import { registerAndLogin } from "./helpers/auth"
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes"

test.describe("Recipe CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test("should create a new recipe with all fields populated", async ({
    page,
  }) => {
    await registerAndLogin(page)

    const recipeName = getUniqueRecipeName("Full Recipe")
    await page.goto("/recipes/new")

    await submitRecipeForm(page, {
      name: recipeName,
      notes: "A delicious test recipe",
      prepTime: "15",
      cookTime: "30",
      servings: "4",
      difficulty: "medium",
      ingredients: "2 cups flour\n1 cup sugar\n3 eggs",
      instructions: "Mix dry ingredients\nAdd eggs and stir\nBake at 350F for 30 minutes",
      calories: "250",
      fat: "10",
      cholesterol: "50",
      sodium: "200",
      protein: "8",
    })

    // Should redirect to the recipe detail page
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)

    // Verify all data is displayed on the detail page
    await expect(page.getByRole("heading", { name: recipeName })).toBeVisible()
    await expect(page.getByText("A delicious test recipe")).toBeVisible()
    await expect(page.getByText("15 min")).toBeVisible()
    await expect(page.getByText("30 min")).toBeVisible()
    await expect(page.getByText("medium")).toBeVisible()

    // Verify servings — the detail page shows the label "Servings" and value in adjacent elements
    const metaGrid = page.locator(".grid.grid-cols-2").first()
    await expect(metaGrid.getByText("Servings")).toBeVisible()
    await expect(metaGrid.getByText("4", { exact: true })).toBeVisible()

    // Verify ingredients
    await expect(page.getByText("2 cups flour")).toBeVisible()
    await expect(page.getByText("1 cup sugar")).toBeVisible()
    await expect(page.getByText("3 eggs")).toBeVisible()

    // Verify instructions
    await expect(page.getByText("Mix dry ingredients")).toBeVisible()
    await expect(page.getByText("Add eggs and stir")).toBeVisible()
    await expect(
      page.getByText("Bake at 350F for 30 minutes"),
    ).toBeVisible()

    // Verify nutrition values within the Nutrition section
    const nutritionHeading = page.getByRole("heading", { name: "Nutrition" })
    await expect(nutritionHeading).toBeVisible()
    await expect(page.getByText("250")).toBeVisible()
    await expect(page.getByText("10g")).toBeVisible()
    await expect(page.getByText("50mg")).toBeVisible()
    await expect(page.getByText("200mg")).toBeVisible()
    await expect(page.getByText("8g")).toBeVisible()
  })

  test("should edit an existing recipe and verify changes persist", async ({
    page,
  }) => {
    await registerAndLogin(page)

    // Create a recipe first
    const originalName = getUniqueRecipeName("Edit Me")
    await page.goto("/recipes/new")
    await submitRecipeForm(page, {
      name: originalName,
      notes: "Original notes",
      prepTime: "10",
      servings: "2",
    })
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)

    // Navigate to edit page
    await page.getByRole("link", { name: "Edit Recipe" }).click()
    await page.waitForURL(/\/recipes\/[a-f0-9-]+\/edit$/)
    await page.waitForLoadState("networkidle")

    // Change fields
    const updatedName = getUniqueRecipeName("Edited Recipe")
    await page.getByLabel("Recipe Name").fill(updatedName)
    await page.getByLabel("Notes").fill("Updated notes")
    await page.getByLabel("Prep Time (minutes)").fill("25")
    await page.getByLabel("Servings").fill("6")
    await page.getByRole("button", { name: "Update Recipe" }).click()

    // Should redirect back to detail page
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)

    // Verify updated data
    await expect(
      page.getByRole("heading", { name: updatedName }),
    ).toBeVisible()
    await expect(page.getByText("Updated notes")).toBeVisible()
    await expect(page.getByText("25 min")).toBeVisible()

    // Verify servings in the meta grid
    const metaGrid = page.locator(".grid.grid-cols-2").first()
    await expect(metaGrid.getByText("6", { exact: true })).toBeVisible()
  })

  test("should delete a recipe via confirmation modal", async ({ page }) => {
    await registerAndLogin(page)

    // Create a recipe to delete
    const recipeName = getUniqueRecipeName("Delete Me")
    await page.goto("/recipes/new")
    await submitRecipeForm(page, { name: recipeName })
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)

    // Click Delete Recipe button
    await page.getByRole("button", { name: "Delete Recipe" }).click()

    // Verify modal appears with recipe name
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText("Delete Recipe")).toBeVisible()
    await expect(dialog.getByText(recipeName)).toBeVisible()

    // Confirm deletion and wait for redirect to recipe list
    await Promise.all([
      page.waitForURL("/recipes"),
      dialog.getByRole("button", { name: "Delete" }).click(),
    ])

    // Verify the recipe is no longer in the list
    await expect(page.getByText(recipeName)).not.toBeVisible()
  })
})
