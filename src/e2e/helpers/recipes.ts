import type { Page } from "@playwright/test";
import { getUniqueSuffix } from "./utils";

export interface RecipeData {
  name: string;
  ingredients?: string;
  instructions?: string;
  notes?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  difficulty?: "easy" | "medium" | "hard";
  calories?: string;
  fat?: string;
  cholesterol?: string;
  sodium?: string;
  protein?: string;
  isPublic?: boolean;
}

/** Generate a unique recipe name for test isolation. */
export function getUniqueRecipeName(prefix = "Test Recipe") {
  return `${prefix} ${getUniqueSuffix()}`;
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
} as const satisfies Partial<Record<keyof RecipeData, string>>;

/**
 * Fill the recipe form and submit it.
 * Assumes the page is already on /recipes/new or /recipes/:id/edit.
 */
export async function submitRecipeForm(page: Page, data: RecipeData) {
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Recipe Name").waitFor({ state: "visible" });

  await page.getByLabel("Recipe Name").fill(data.name);

  for (const [key, label] of Object.entries(textFieldLabels)) {
    const value = data[key as keyof typeof textFieldLabels];
    if (value !== undefined && value !== null) {
      await page.getByLabel(label).fill(String(value));
    }
  }

  if (data.difficulty) {
    await page.getByLabel("Difficulty").selectOption(data.difficulty);
  }

  // isPublic checkbox is checked by default; uncheck if explicitly false
  if (data.isPublic === false) {
    await page.getByLabel("Public recipe (visible to everyone)").uncheck();
  }

  await page.getByRole("button", { name: /(Create|Update) Recipe/ }).click();
}

/**
 * Click the "Personal" option in the source combobox without filling the name field.
 * Use this when asserting the Personal Name input state after selection.
 *
 * Registers waitForResponse before filling the search field to avoid a race with the
 * tRPC sources.search request. The response status is validated before the click.
 */
// skipcq: JS-0067 -- named export, not a global; matches every other helper in this module
export async function clickPersonalSourceOption(page: Page) {
  const responsePromise = page.waitForResponse(/\/api\/trpc\/sources\.search/);
  await page.getByPlaceholder("Search for a source...").fill("Personal");
  const searchResponse = await responsePromise;
  if (!searchResponse.ok()) {
    throw new Error(
      `sources.search failed (${searchResponse.status()}) — is the "Personal" source seeded? Body: ${await searchResponse.text()}`,
    );
  }
  const personalButton = page.getByRole("button", { name: "Personal", exact: true });
  await personalButton
    .waitFor({ state: "visible", timeout: 5000 })
    .catch((err: Error) => {
      throw new Error(
        `Personal source option not found in dropdown — verify the "Personal" source is present in the database seed. Original cause: ${err.message}`,
      );
    });
  await personalButton.click();
}

/**
 * Select "Personal" from the source combobox and fill in the personal name.
 * Searches for "Personal" → waits for the tRPC sources.search response → clicks option → fills name.
 */
// skipcq: JS-0067 -- named export, not a global; matches every other helper in this module
export async function selectPersonalSource(page: Page, name: string) {
  await clickPersonalSourceOption(page);
  await page.getByLabel("Personal Name").fill(name);
}
