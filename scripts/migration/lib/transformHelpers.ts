import { createHash } from "node:crypto";

export interface LegacyPivot {
  id: number;
  recipe_id?: number;
  cookbook_id?: number;
  meal_id?: number;
  course_id?: number;
  preparation_id?: number;
}

export function createIdMap(namespace: string, legacyIds: number[]) {
  return Object.fromEntries(
    legacyIds.map((legacyId) => [
      legacyId,
      deterministicObjectId(namespace, legacyId),
    ]),
  );
}

export function deterministicObjectId(namespace: string, legacyId: number) {
  return createHash("sha1")
    .update(`${namespace}:${legacyId}`)
    .digest("hex")
    .slice(0, 24);
}

export function groupPivotIds(
  rows: LegacyPivot[],
  sourceKey: "recipe_id",
  targetKey: "meal_id" | "course_id" | "preparation_id",
  idMap: Record<number, string>,
) {
  const grouped = new Map<number, string[]>();

  for (const row of rows) {
    const sourceId = row[sourceKey];
    const targetId = row[targetKey];

    if (!sourceId || !targetId) {
      continue;
    }

    const values = grouped.get(sourceId) ?? [];
    values.push(idMap[targetId]);
    grouped.set(sourceId, values);
  }

  return grouped;
}

export function groupCookbookRecipes(
  rows: LegacyPivot[],
  recipeIdMap: Record<number, string>,
) {
  const grouped = new Map<number, { recipeId: string; orderIndex: number }[]>();

  for (const row of rows) {
    const cookbookId = row.cookbook_id;
    const recipeId = row.recipe_id;

    if (!cookbookId || !recipeId) {
      continue;
    }

    const values = grouped.get(cookbookId) ?? [];
    values.push({
      recipeId: recipeIdMap[recipeId],
      orderIndex: values.length,
    });
    grouped.set(cookbookId, values);
  }

  return grouped;
}

export function normalizeTimestamp(value: string | null) {
  if (!value || value === "0000-00-00 00:00:00") {
    return null;
  }

  return new Date(value.replace(" ", "T") + "Z").toISOString();
}

export function normalizeText(value: string | null) {
  if (value === null) {
    return null;
  }

  return value.replace(/\r\n/g, "\n");
}

export function normalizeInteger(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  return value;
}

export function normalizeNumber(value: string | number | null) {
  if (value === null || value === "") {
    return null;
  }

  const numeric =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  return Number.isNaN(numeric) ? null : numeric;
}

export function resolveLegacyReference(
  value: number | null,
  idMap: Record<number, string>,
) {
  if (!value || value === 0) {
    return null;
  }

  return idMap[value] ?? null;
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
