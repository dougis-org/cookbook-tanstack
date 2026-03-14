import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createIdMap,
  groupCookbookRecipes,
  groupPivotIds,
  normalizeInteger,
  normalizeNumber,
  normalizeText,
  normalizeTimestamp,
  resolveLegacyReference,
  slugify,
  type LegacyPivot,
} from "./lib/transformHelpers";

const repoRoot = process.cwd();
const extractedDir = resolve(repoRoot, "data/legacy-migration/extracted");
const manifestsDir = resolve(repoRoot, "data/legacy-migration/manifests");
const transformedDir = resolve(repoRoot, "data/legacy-migration/transformed");
const reportsDir = resolve(repoRoot, "data/legacy-migration/reports");

const DEFAULT_ADMIN_PLACEHOLDER = "__DEFAULT_ADMIN__";

interface LegacyClassification {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface LegacySource {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface LegacyMeal {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface LegacyCourse {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface LegacyPreparation {
  id: number;
  description: string;
  created_at: string;
  updated_at: string;
}

interface LegacyRecipe {
  id: number;
  name: string;
  ingredients: string | null;
  instructions: string | null;
  notes: string | null;
  servings: number | null;
  source_id: number | null;
  classification_id: number | null;
  date_added: string | null;
  calories: string | number | null;
  fat: string | number | null;
  cholesterol: string | number | null;
  sodium: string | number | null;
  protein: string | number | null;
  marked: number | null;
  created_at: string;
  updated_at: string;
}

interface LegacyCookbook {
  id: number;
  name: string | null;
  created_at: string;
  updated_at: string;
}

async function main() {
  await Promise.all([
    mkdir(transformedDir, { recursive: true }),
    mkdir(manifestsDir, { recursive: true }),
    mkdir(reportsDir, { recursive: true }),
  ]);

  const [
    classifications,
    sources,
    meals,
    courses,
    preparations,
    recipes,
    cookbooks,
    recipeMeals,
    recipeCourses,
    recipePreparations,
    cookbookRecipes,
  ] = await Promise.all([
    readJson<LegacyClassification[]>("classifications.json"),
    readJson<LegacySource[]>("sources.json"),
    readJson<LegacyMeal[]>("meals.json"),
    readJson<LegacyCourse[]>("courses.json"),
    readJson<LegacyPreparation[]>("preparations.json"),
    readJson<LegacyRecipe[]>("recipes.json"),
    readJson<LegacyCookbook[]>("cookbooks.json"),
    readJson<LegacyPivot[]>("recipe_meals.json"),
    readJson<LegacyPivot[]>("recipe_courses.json"),
    readJson<LegacyPivot[]>("recipe_preparations.json"),
    readJson<LegacyPivot[]>("cookbook_recipes.json"),
  ]);

  const idMaps = {
    classifications: createIdMap(
      "classification",
      classifications.map((row) => row.id),
    ),
    sources: createIdMap(
      "source",
      sources.map((row) => row.id),
    ),
    meals: createIdMap(
      "meal",
      meals.map((row) => row.id),
    ),
    courses: createIdMap(
      "course",
      courses.map((row) => row.id),
    ),
    preparations: createIdMap(
      "preparation",
      preparations.map((row) => row.id),
    ),
    recipes: createIdMap(
      "recipe",
      recipes.map((row) => row.id),
    ),
    cookbooks: createIdMap(
      "cookbook",
      cookbooks.map((row) => row.id),
    ),
  };

  const groupedMealIds = groupPivotIds(
    recipeMeals,
    "recipe_id",
    "meal_id",
    idMaps.meals,
  );
  const groupedCourseIds = groupPivotIds(
    recipeCourses,
    "recipe_id",
    "course_id",
    idMaps.courses,
  );
  const groupedPreparationIds = groupPivotIds(
    recipePreparations,
    "recipe_id",
    "preparation_id",
    idMaps.preparations,
  );
  const groupedCookbookRecipes = groupCookbookRecipes(
    cookbookRecipes,
    idMaps.recipes,
  );

  const transformed = {
    classifications: classifications.map((row) => ({
      _id: idMaps.classifications[row.id],
      legacyId: row.id,
      name: row.name,
      description: null,
      slug: slugify(row.name),
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    })),
    sources: sources.map((row) => ({
      _id: idMaps.sources[row.id],
      legacyId: row.id,
      name: row.name,
      url: null,
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    })),
    meals: meals.map((row) => ({
      _id: idMaps.meals[row.id],
      legacyId: row.id,
      name: row.name,
      description: null,
      slug: slugify(row.name),
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    })),
    courses: courses.map((row) => ({
      _id: idMaps.courses[row.id],
      legacyId: row.id,
      name: row.name,
      description: null,
      slug: slugify(row.name),
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    })),
    preparations: preparations.map((row) => ({
      _id: idMaps.preparations[row.id],
      legacyId: row.id,
      name: row.description,
      description: row.description,
      slug: slugify(row.description),
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    })),
    recipes: recipes.map((row) => ({
      _id: idMaps.recipes[row.id],
      legacyId: row.id,
      userId: DEFAULT_ADMIN_PLACEHOLDER,
      legacyOwnerId: null,
      legacyOwnerSource: null,
      name: row.name,
      ingredients: normalizeText(row.ingredients),
      instructions: normalizeText(row.instructions),
      notes: normalizeText(row.notes),
      servings: normalizeInteger(row.servings),
      prepTime: null,
      cookTime: null,
      difficulty: null,
      sourceId: resolveLegacyReference(row.source_id, idMaps.sources),
      classificationId: resolveLegacyReference(
        row.classification_id,
        idMaps.classifications,
      ),
      dateAdded: normalizeTimestamp(row.date_added),
      calories: normalizeNumber(row.calories),
      fat: normalizeNumber(row.fat),
      cholesterol: normalizeNumber(row.cholesterol),
      sodium: normalizeNumber(row.sodium),
      protein: normalizeNumber(row.protein),
      imageUrl: null,
      isPublic: true,
      marked: row.marked === 1,
      mealIds: groupedMealIds.get(row.id) ?? [],
      courseIds: groupedCourseIds.get(row.id) ?? [],
      preparationIds: groupedPreparationIds.get(row.id) ?? [],
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    })),
    cookbooks: cookbooks.map((row) => ({
      _id: idMaps.cookbooks[row.id],
      legacyId: row.id,
      userId: DEFAULT_ADMIN_PLACEHOLDER,
      legacyOwnerId: null,
      legacyOwnerSource: null,
      name: row.name,
      description: null,
      isPublic: true,
      imageUrl: null,
      recipes: groupedCookbookRecipes.get(row.id) ?? [],
      createdAt: normalizeTimestamp(row.created_at),
      updatedAt: normalizeTimestamp(row.updated_at),
    })),
  };

  await Promise.all([
    writeJson(
      resolve(transformedDir, "classifications.json"),
      transformed.classifications,
    ),
    writeJson(resolve(transformedDir, "sources.json"), transformed.sources),
    writeJson(resolve(transformedDir, "meals.json"), transformed.meals),
    writeJson(resolve(transformedDir, "courses.json"), transformed.courses),
    writeJson(
      resolve(transformedDir, "preparations.json"),
      transformed.preparations,
    ),
    writeJson(resolve(transformedDir, "recipes.json"), transformed.recipes),
    writeJson(resolve(transformedDir, "cookbooks.json"), transformed.cookbooks),
    writeJson(resolve(manifestsDir, "legacy-id-map.json"), idMaps),
    writeJson(resolve(manifestsDir, "ownership-lineage.json"), {
      recipes: transformed.recipes.map((row) => ({
        legacyId: row.legacyId,
        importId: row._id,
        legacyOwnerId: row.legacyOwnerId,
        legacyOwnerSource: row.legacyOwnerSource,
      })),
      cookbooks: transformed.cookbooks.map((row) => ({
        legacyId: row.legacyId,
        importId: row._id,
        legacyOwnerId: row.legacyOwnerId,
        legacyOwnerSource: row.legacyOwnerSource,
      })),
    }),
    writeJson(resolve(reportsDir, "transformation-summary.json"), {
      transformedAt: new Date().toISOString(),
      defaultAdminPlaceholder: DEFAULT_ADMIN_PLACEHOLDER,
      counts: {
        classifications: transformed.classifications.length,
        sources: transformed.sources.length,
        meals: transformed.meals.length,
        courses: transformed.courses.length,
        preparations: transformed.preparations.length,
        recipes: transformed.recipes.length,
        cookbooks: transformed.cookbooks.length,
      },
    }),
  ]);

  console.log(
    "Transformed legacy extraction artifacts into MongoDB-ready JSON",
  );
}

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(
    await readFile(resolve(extractedDir, fileName), "utf8"),
  ) as T;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
