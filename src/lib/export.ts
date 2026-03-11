import type { Recipe } from "@/types/recipe";

export const RECIPE_EXPORT_VERSION = "1" as const;

interface ExportedRecipe extends Recipe {
  _version: typeof RECIPE_EXPORT_VERSION;
}

export function exportRecipeToJson(recipe: Recipe): string {
  const exported: ExportedRecipe = {
    ...recipe,
    _version: RECIPE_EXPORT_VERSION,
  };

  return JSON.stringify(exported, null, 2);
}
