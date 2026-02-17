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

/** Fields that map directly from RecipeData keys to form labels. */
const textFieldLabels = {
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
} as const satisfies Partial<Record<keyof RecipeData, string>>

/**
 * Fill the recipe form and submit it.
 * Assumes the page is already on /recipes/new or /recipes/:id/edit.
 */
export async function createRecipeViaUI(page: Page, data: RecipeData) {
  await page.getByLabel("Recipe Name").fill(data.name)

  for (const [key, label] of Object.entries(textFieldLabels)) {
    const value = data[key as keyof typeof textFieldLabels]
    if (value !== undefined && value !== null) {
      await page.getByLabel(label).fill(String(value))
    }
  }

  if (data.difficulty) {
    await page.getByLabel("Difficulty").selectOption(data.difficulty)
  }

  // isPublic checkbox is checked by default; uncheck if explicitly false
  if (data.isPublic === false) {
    await page.getByLabel("Public recipe (visible to everyone)").uncheck()
  }

  await page.getByRole("button", { name: /^(Create Recipe|Update Recipe)$/ }).click()
}
