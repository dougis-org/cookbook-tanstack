import type { Recipe } from "@/types/recipe";

export const RECIPE_EXPORT_VERSION = "1" as const;

interface ExportedRecipe extends Recipe {
  _version: typeof RECIPE_EXPORT_VERSION;
}

type IdLike =
  | string
  | number
  | { id?: string; _id?: string; toString?: () => string }
  | null
  | undefined;

function toObjectIdString(value: IdLike): string | null | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (typeof value.id === "string") return value.id;
    if (typeof value._id === "string") return value._id;
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
  const sourceId = toObjectIdString(
    (recipe as unknown as Record<string, unknown>).sourceId as IdLike,
  );
  const classificationId = toObjectIdString(
    (recipe as unknown as Record<string, unknown>).classificationId as IdLike,
  );
  const mealIds = normalizeIdArray(
    (recipe as unknown as Record<string, unknown>).mealIds,
  );
  const courseIds = normalizeIdArray(
    (recipe as unknown as Record<string, unknown>).courseIds,
  );
  const preparationIds = normalizeIdArray(
    (recipe as unknown as Record<string, unknown>).preparationIds,
  );

  const exported: ExportedRecipe = {
    ...recipe,
    sourceId: sourceId ?? undefined,
    classificationId: classificationId ?? undefined,
    mealIds: mealIds ?? [],
    courseIds: courseIds ?? [],
    preparationIds: preparationIds ?? [],
    _version: RECIPE_EXPORT_VERSION,
  };

  return JSON.stringify(exported, null, 2);
}
