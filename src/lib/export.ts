import type { Recipe } from "@/types/recipe";

export const RECIPE_EXPORT_VERSION = "1" as const;

interface ExportedRecipe extends Recipe {
  _version: typeof RECIPE_EXPORT_VERSION;
}

type IdLikeObject = {
  id?: IdLike;
  _id?: IdLike;
  toString?: () => string;
};

type IdLike = string | number | IdLikeObject | null | undefined;

function toObjectIdString(value: IdLike): string | null | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    const nestedId = toObjectIdString(value.id);
    if (nestedId !== undefined) return nestedId;

    const nestedObjectId = toObjectIdString(value._id);
    if (nestedObjectId !== undefined) return nestedObjectId;

    if (typeof value.toString === "function") {
      const str = value.toString();
      if (str && str !== "[object Object]") return str;
    }
  }

  return undefined;
}

function normalizeIdArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  return value
    .map((item) => toObjectIdString(item as IdLike))
    .filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    );
}

export function exportRecipeToJson(recipe: Recipe): string {
  const recipeAsRecord = recipe as unknown as Record<string, unknown>;
  const sourceId = toObjectIdString(recipeAsRecord.sourceId as IdLike);
  const classificationId = toObjectIdString(
    recipeAsRecord.classificationId as IdLike,
  );
  const mealIds = normalizeIdArray(recipeAsRecord.mealIds);
  const courseIds = normalizeIdArray(recipeAsRecord.courseIds);
  const preparationIds = normalizeIdArray(recipeAsRecord.preparationIds);

  const exported: ExportedRecipe = {
    ...recipe,
    sourceId: sourceId ?? null,
    classificationId: classificationId ?? null,
    mealIds: mealIds ?? [],
    courseIds: courseIds ?? [],
    preparationIds: preparationIds ?? [],
    _version: RECIPE_EXPORT_VERSION,
  };

  return JSON.stringify(exported, null, 2);
}
