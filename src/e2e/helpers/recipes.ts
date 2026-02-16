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

  const fieldsToFill: Partial<Record<keyof RecipeData, string>> = {
    notes: "Notes",
    prepTime: "Prep Time (minutes)",
    cookTime: "Cook Time (minutes)",
    servings: "Servings",
    ingredients: "Ingredients",
    instructions: "Instructions",
    calories: "Calories",
    fat: "Fat (g)",
    cholesterol: "Cholesterol (mg)",
    sodium: "Sodium (mg)",
    protein: "Protein (g)",
  }

  for (const key in fieldsToFill) {
    const value = data[key as keyof RecipeData]
    if (value !== undefined && value !== null) {
      await page.getByLabel(fieldsToFill[key as keyof RecipeData]!).fill(String(value))
    }
  }

  if (data.difficulty) {
    await page.getByLabel("Difficulty").selectOption(data.difficulty)
  }

  // isPublic checkbox is checked by default; uncheck if explicitly false
  if (data.isPublic === false) {
    await page.getByLabel("Public recipe (visible to everyone)").uncheck()
  }

  await page.getByRole("button", { name: /Create Recipe|Update Recipe/ }).click()
}
