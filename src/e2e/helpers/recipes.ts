import type { Page } from "@playwright/test"

export interface RecipeData {
  name: string
  ingredients?: string
  instructions?: string
  notes?: string
  prepTime?: string
  cookTime?: string
  servings?: string
  difficulty?: "easy" | "medium" | "hard"
  calories?: string
  fat?: string
  cholesterol?: string
  sodium?: string
  protein?: string
  isPublic?: boolean
}

/** Generate a unique recipe name for test isolation. */
export function getUniqueRecipeName(prefix = "Test Recipe") {
  return `${prefix} ${Date.now()}`
}

/**
 * Fill the recipe form and submit it.
 * Assumes the page is already on /recipes/new or /recipes/:id/edit.
 */
export async function createRecipeViaUI(page: Page, data: RecipeData) {
  await page.getByLabel("Recipe Name").fill(data.name)

  if (data.notes) {
    await page.getByLabel("Notes").fill(data.notes)
  }

  if (data.prepTime) {
    await page.getByLabel("Prep Time (minutes)").fill(data.prepTime)
  }

  if (data.cookTime) {
    await page.getByLabel("Cook Time (minutes)").fill(data.cookTime)
  }

  if (data.servings) {
    await page.getByLabel("Servings").fill(data.servings)
  }

  if (data.difficulty) {
    await page.getByLabel("Difficulty").selectOption(data.difficulty)
  }

  if (data.ingredients) {
    await page.getByLabel("Ingredients").fill(data.ingredients)
  }

  if (data.instructions) {
    await page.getByLabel("Instructions").fill(data.instructions)
  }

  if (data.calories) {
    await page.getByLabel("Calories").fill(data.calories)
  }

  if (data.fat) {
    await page.getByLabel("Fat (g)").fill(data.fat)
  }

  if (data.cholesterol) {
    await page.getByLabel("Cholesterol (mg)").fill(data.cholesterol)
  }

  if (data.sodium) {
    await page.getByLabel("Sodium (mg)").fill(data.sodium)
  }

  if (data.protein) {
    await page.getByLabel("Protein (g)").fill(data.protein)
  }

  // isPublic checkbox is checked by default; uncheck if explicitly false
  if (data.isPublic === false) {
    await page.getByLabel("Public recipe (visible to everyone)").uncheck()
  }

  await page.getByRole("button", { name: /Create Recipe|Update Recipe/ }).click()
}
