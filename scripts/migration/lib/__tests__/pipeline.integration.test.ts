// @vitest-environment node
/**
 * Integration tests for the Laravel → MongoDB migration pipeline.
 *
 * Task 2.2: Full pipeline (extract → transform → import) against representative
 *           fixtures; stable reruns without duplicate records (idempotency).
 * Task 2.3: Verification coverage — default admin ownership, recipe queries,
 *           cookbook ordering, meal filter, and no-image migration outcome.
 */
import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import {
  Classification,
  Source,
  Meal,
  Course,
  Preparation,
  Recipe,
  Cookbook,
} from "@/db/models";
import { getMongoClient } from "@/db";
import { buildImageAudit } from "../imageAudit";
import { extractTables, TARGET_TABLES } from "../mysqlDump";
import {
  DEFAULT_ADMIN_PLACEHOLDER,
  prepareCookbookDocument,
  prepareRecipeDocument,
  prepareTaxonomyDocument,
  type CookbookDocument,
  type RecipeDocument,
  type TaxonomyDocument,
} from "../importHelpers";
import {
  createIdMap,
  deterministicObjectId,
  groupCookbookRecipes,
  groupPivotIds,
  normalizeInteger,
  normalizeNumber,
  normalizeText,
  normalizeTimestamp,
  resolveLegacyReference,
  slugify,
  type LegacyPivot,
} from "../transformHelpers";

// ── Representative SQL fixture ────────────────────────────────────────────────
//
// Contains 1 classification, 1 source, 1 meal, 1 course, 1 preparation,
// 2 recipes (both linked to meal 1; recipe 1 also linked to course 1 and
// preparation 1), and 1 cookbook with 2 entries (recipe 2 ordered first,
// recipe 1 ordered second). All 11 TARGET_TABLES are present.
const FIXTURE_SQL = `CREATE TABLE \`classifications\` (
  \`id\` int NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT NULL,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`classifications\` VALUES (1,'Chicken','2020-01-01 00:00:00','2020-01-01 00:00:00');
CREATE TABLE \`sources\` (
  \`id\` int NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT NULL,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`sources\` VALUES (1,'Betty Crocker','2020-01-01 00:00:00','2020-01-01 00:00:00');
CREATE TABLE \`meals\` (
  \`id\` int NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT NULL,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`meals\` VALUES (1,'Dinner','2020-01-01 00:00:00','2020-01-01 00:00:00');
CREATE TABLE \`courses\` (
  \`id\` int NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT NULL,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`courses\` VALUES (1,'Main Course','2020-01-01 00:00:00','2020-01-01 00:00:00');
CREATE TABLE \`preparations\` (
  \`id\` int NOT NULL,
  \`description\` varchar(255) NOT NULL,
  \`created_at\` timestamp NULL DEFAULT NULL,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`preparations\` VALUES (1,'Baked','2020-01-01 00:00:00','2020-01-01 00:00:00');
CREATE TABLE \`recipes\` (
  \`id\` int NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`ingredients\` text,
  \`instructions\` text,
  \`notes\` text,
  \`servings\` int DEFAULT NULL,
  \`source_id\` int DEFAULT NULL,
  \`classification_id\` int DEFAULT NULL,
  \`date_added\` date DEFAULT NULL,
  \`calories\` decimal(8,2) DEFAULT NULL,
  \`fat\` decimal(8,2) DEFAULT NULL,
  \`cholesterol\` decimal(8,2) DEFAULT NULL,
  \`sodium\` decimal(8,2) DEFAULT NULL,
  \`protein\` decimal(8,2) DEFAULT NULL,
  \`marked\` tinyint(1) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT NULL,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`recipes\` VALUES (1,'Roasted Chicken','2 lbs chicken','Preheat oven; season',NULL,4,1,1,'2020-01-01',350.00,NULL,NULL,NULL,NULL,0,'2020-01-01 00:00:00','2020-01-01 00:00:00'),(2,'Baked Salmon','1 lb salmon','Season; bake',NULL,2,NULL,NULL,'2021-06-15',NULL,NULL,NULL,NULL,NULL,0,'2021-06-15 00:00:00','2021-06-15 00:00:00');
CREATE TABLE \`cookbooks\` (
  \`id\` int NOT NULL,
  \`name\` varchar(255) DEFAULT NULL,
  \`created_at\` timestamp NULL DEFAULT NULL,
  \`updated_at\` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`cookbooks\` VALUES (1,'Weeknight Dinners','2020-01-01 00:00:00','2020-01-01 00:00:00');
CREATE TABLE \`recipe_meals\` (
  \`id\` int NOT NULL,
  \`recipe_id\` int NOT NULL,
  \`meal_id\` int NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`recipe_meals\` VALUES (1,1,1),(2,2,1);
CREATE TABLE \`recipe_courses\` (
  \`id\` int NOT NULL,
  \`recipe_id\` int NOT NULL,
  \`course_id\` int NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`recipe_courses\` VALUES (1,1,1);
CREATE TABLE \`recipe_preparations\` (
  \`id\` int NOT NULL,
  \`recipe_id\` int NOT NULL,
  \`preparation_id\` int NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`recipe_preparations\` VALUES (1,1,1);
CREATE TABLE \`cookbook_recipes\` (
  \`id\` int NOT NULL,
  \`cookbook_id\` int NOT NULL,
  \`recipe_id\` int NOT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB;
INSERT INTO \`cookbook_recipes\` VALUES (1,1,2),(2,1,1);`;

// ── Shared helpers ─────────────────────────────────────────────────────────────

type ExtractedRow = Record<string, unknown>;

/**
 * Replicates the transform stage from transform-laravel-data.ts using the
 * library functions in transformHelpers.ts, without file I/O.
 */
function buildTransformed(sql: string) {
  const extracted = extractTables(sql, TARGET_TABLES)
  const classifications = extracted.classifications.rows as ExtractedRow[]
  const sources = extracted.sources.rows as ExtractedRow[]
  const meals = extracted.meals.rows as ExtractedRow[]
  const courses = extracted.courses.rows as ExtractedRow[]
  const preparations = extracted.preparations.rows as ExtractedRow[]
  const recipes = extracted.recipes.rows as ExtractedRow[]
  const cookbooks = extracted.cookbooks.rows as ExtractedRow[]
  const recipeMeals = extracted.recipe_meals.rows as any as LegacyPivot[]
  const recipeCourses = extracted.recipe_courses.rows as any as LegacyPivot[]
  const recipePreparations = extracted.recipe_preparations.rows as any as LegacyPivot[]
  const cookbookRecipes = extracted.cookbook_recipes.rows as any as LegacyPivot[]

  const idMaps = {
    classifications: createIdMap(
      "classification",
      classifications.map((r) => r.id as number),
    ),
    sources: createIdMap(
      "source",
      sources.map((r) => r.id as number),
    ),
    meals: createIdMap(
      "meal",
      meals.map((r) => r.id as number),
    ),
    courses: createIdMap(
      "course",
      courses.map((r) => r.id as number),
    ),
    preparations: createIdMap(
      "preparation",
      preparations.map((r) => r.id as number),
    ),
    recipes: createIdMap(
      "recipe",
      recipes.map((r) => r.id as number),
    ),
    cookbooks: createIdMap(
      "cookbook",
      cookbooks.map((r) => r.id as number),
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
  const groupedPrepIds = groupPivotIds(
    recipePreparations,
    "recipe_id",
    "preparation_id",
    idMaps.preparations,
  );
  const groupedCookbookRecipes = groupCookbookRecipes(
    cookbookRecipes,
    idMaps.recipes,
  );

  return {
    idMaps,
    classifications: classifications.map((row) => ({
      _id: idMaps.classifications[row.id as number],
      legacyId: row.id as number,
      name: (row.name as string | null) ?? null,
      description: null,
      slug: slugify((row.name as string) ?? ""),
      createdAt: normalizeTimestamp((row.created_at as string) ?? null),
      updatedAt: normalizeTimestamp((row.updated_at as string) ?? null),
    })) as TaxonomyDocument[],
    sources: sources.map((row) => ({
      _id: idMaps.sources[row.id as number],
      legacyId: row.id as number,
      name: (row.name as string | null) ?? null,
      url: null,
      createdAt: normalizeTimestamp((row.created_at as string) ?? null),
      updatedAt: normalizeTimestamp((row.updated_at as string) ?? null),
    })) as TaxonomyDocument[],
    meals: meals.map((row) => ({
      _id: idMaps.meals[row.id as number],
      legacyId: row.id as number,
      name: (row.name as string | null) ?? null,
      description: null,
      slug: slugify((row.name as string) ?? ""),
      createdAt: normalizeTimestamp((row.created_at as string) ?? null),
      updatedAt: normalizeTimestamp((row.updated_at as string) ?? null),
    })) as TaxonomyDocument[],
    courses: courses.map((row) => ({
      _id: idMaps.courses[row.id as number],
      legacyId: row.id as number,
      name: (row.name as string | null) ?? null,
      description: null,
      slug: slugify((row.name as string) ?? ""),
      createdAt: normalizeTimestamp((row.created_at as string) ?? null),
      updatedAt: normalizeTimestamp((row.updated_at as string) ?? null),
    })) as TaxonomyDocument[],
    preparations: preparations.map((row) => ({
      _id: idMaps.preparations[row.id as number],
      legacyId: row.id as number,
      name: (row.description as string | null) ?? null,
      description: (row.description as string | null) ?? null,
      slug: slugify((row.description as string) ?? ""),
      createdAt: normalizeTimestamp((row.created_at as string) ?? null),
      updatedAt: normalizeTimestamp((row.updated_at as string) ?? null),
    })) as TaxonomyDocument[],
    recipes: recipes.map((row) => ({
      _id: idMaps.recipes[row.id as number],
      legacyId: row.id as number,
      userId: DEFAULT_ADMIN_PLACEHOLDER,
      legacyOwnerId: null,
      legacyOwnerSource: null,
      name: (row.name as string | null) ?? null,
      ingredients: normalizeText((row.ingredients as string | null) ?? null),
      instructions: normalizeText((row.instructions as string | null) ?? null),
      notes: normalizeText((row.notes as string | null) ?? null),
      servings: normalizeInteger((row.servings as number | null) ?? null),
      prepTime: null,
      cookTime: null,
      difficulty: null,
      sourceId: resolveLegacyReference(
        (row.source_id as number | null) ?? null,
        idMaps.sources,
      ),
      classificationId: resolveLegacyReference(
        (row.classification_id as number | null) ?? null,
        idMaps.classifications,
      ),
      dateAdded: normalizeTimestamp((row.date_added as string | null) ?? null),
      calories: normalizeNumber(
        (row.calories as string | number | null) ?? null,
      ),
      fat: normalizeNumber((row.fat as string | number | null) ?? null),
      cholesterol: normalizeNumber(
        (row.cholesterol as string | number | null) ?? null,
      ),
      sodium: normalizeNumber((row.sodium as string | number | null) ?? null),
      protein: normalizeNumber((row.protein as string | number | null) ?? null),
      imageUrl: null,
      isPublic: true,
      marked: (row.marked as number | null) === 1,
      mealIds: groupedMealIds.get(row.id as number) ?? [],
      courseIds: groupedCourseIds.get(row.id as number) ?? [],
      preparationIds: groupedPrepIds.get(row.id as number) ?? [],
      createdAt: normalizeTimestamp((row.created_at as string) ?? null),
      updatedAt: normalizeTimestamp((row.updated_at as string) ?? null),
    })) as RecipeDocument[],
    cookbooks: cookbooks.map((row) => ({
      _id: idMaps.cookbooks[row.id as number],
      legacyId: row.id as number,
      userId: DEFAULT_ADMIN_PLACEHOLDER,
      legacyOwnerId: null,
      legacyOwnerSource: null,
      name: (row.name as string | null) ?? null,
      description: null,
      isPublic: true,
      imageUrl: null,
      recipes: groupedCookbookRecipes.get(row.id as number) ?? [],
      createdAt: normalizeTimestamp((row.created_at as string) ?? null),
      updatedAt: normalizeTimestamp((row.updated_at as string) ?? null),
    })) as CookbookDocument[],
  };
}

/** Replicates the importCollection bulkWrite logic from import-laravel-data.ts */
async function bulkUpsert(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: import("mongoose").Model<any>,
  documents: Record<string, unknown>[],
) {
  if (documents.length === 0) {
    return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
  }
  const operations = documents.map((doc) => ({
    replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return model.collection.bulkWrite(operations as any[], { ordered: true });
}

function prepareTaxonomy(
  docs: TaxonomyDocument[],
  collectionName: string,
  allowUrl = false,
) {
  return docs.flatMap((doc) => {
    const result = prepareTaxonomyDocument(
      doc,
      Types.ObjectId,
      collectionName,
      allowUrl,
    );
    return result.document ? [result.document as Record<string, unknown>] : [];
  });
}

async function runImport(
  adminId: string,
  transformed: ReturnType<typeof buildTransformed>,
) {
  const preparedClassifications = prepareTaxonomy(
    transformed.classifications,
    "classifications",
  );
  const preparedSources = prepareTaxonomy(transformed.sources, "sources", true);
  const preparedMeals = prepareTaxonomy(transformed.meals, "meals");
  const preparedCourses = prepareTaxonomy(transformed.courses, "courses");
  const preparedPreparations = prepareTaxonomy(
    transformed.preparations,
    "preparations",
  );
  const preparedRecipes = transformed.recipes.flatMap((doc) => {
    const result = prepareRecipeDocument(doc, adminId, Types.ObjectId);
    return result.document ? [result.document as Record<string, unknown>] : [];
  });
  const preparedCookbooks = transformed.cookbooks.flatMap((doc) => {
    const result = prepareCookbookDocument(doc, adminId, Types.ObjectId);
    return result.document ? [result.document as Record<string, unknown>] : [];
  });

  const [
    classResult,
    sourceResult,
    mealResult,
    courseResult,
    prepResult,
    recipeResult,
    cbResult,
  ] = await Promise.all([
    bulkUpsert(Classification, preparedClassifications),
    bulkUpsert(Source, preparedSources),
    bulkUpsert(Meal, preparedMeals),
    bulkUpsert(Course, preparedCourses),
    bulkUpsert(Preparation, preparedPreparations),
    bulkUpsert(Recipe, preparedRecipes),
    bulkUpsert(Cookbook, preparedCookbooks),
  ]);

  return {
    classResult,
    sourceResult,
    mealResult,
    courseResult,
    prepResult,
    recipeResult,
    cbResult,
  };
}

async function createAdminUser() {
  const userId = new Types.ObjectId();
  const now = new Date();

  const db = getMongoClient().db();
  await db.collection("user").insertOne({
    _id: userId,
    email: "admin@test.com",
    emailVerified: true,
    name: "Admin",
    createdAt: now,
    updatedAt: now,
  });

  return String(userId);
}

// ── Task 2.2 — Full pipeline and idempotency ──────────────────────────────────

describe("migration pipeline — full pipeline and idempotency", () => {
  it("imports all fixture collections with correct document counts", async () => {
    await withCleanDb(async () => {
      const adminId = await createAdminUser();
      const transformed = buildTransformed(FIXTURE_SQL);
      await runImport(adminId, transformed);

      const [
        classCount,
        sourceCount,
        mealCount,
        courseCount,
        prepCount,
        recipeCount,
        cbCount,
      ] = await Promise.all([
        Classification.countDocuments(),
        Source.countDocuments(),
        Meal.countDocuments(),
        Course.countDocuments(),
        Preparation.countDocuments(),
        Recipe.countDocuments(),
        Cookbook.countDocuments(),
      ]);

      expect(classCount).toBe(1);
      expect(sourceCount).toBe(1);
      expect(mealCount).toBe(1);
      expect(courseCount).toBe(1);
      expect(prepCount).toBe(1);
      expect(recipeCount).toBe(2);
      expect(cbCount).toBe(1);
    });
  });

  it("second import run produces no additional documents (idempotent)", async () => {
    await withCleanDb(async () => {
      const adminId = await createAdminUser();
      const transformed = buildTransformed(FIXTURE_SQL);

      const first = await runImport(adminId, transformed);
      const firstUpserted =
        first.classResult.upsertedCount +
        first.sourceResult.upsertedCount +
        first.mealResult.upsertedCount +
        first.courseResult.upsertedCount +
        first.prepResult.upsertedCount +
        first.recipeResult.upsertedCount +
        first.cbResult.upsertedCount;

      const second = await runImport(adminId, transformed);
      const secondUpserted =
        second.classResult.upsertedCount +
        second.sourceResult.upsertedCount +
        second.mealResult.upsertedCount +
        second.courseResult.upsertedCount +
        second.prepResult.upsertedCount +
        second.recipeResult.upsertedCount +
        second.cbResult.upsertedCount;

      // All 8 documents (1+1+1+1+1+2+1) are upserted on first run
      expect(firstUpserted).toBe(8);
      // No new documents created on re-run
      expect(secondUpserted).toBe(0);
      // Collection counts unchanged after second import
      expect(await Recipe.countDocuments()).toBe(2);
      expect(await Cookbook.countDocuments()).toBe(1);
    });
  });
});

// ── Task 2.3 — Post-import verification ──────────────────────────────────────

describe("migration pipeline — post-import verification", () => {
  it("all imported recipes are owned by the default admin user", async () => {
    await withCleanDb(async () => {
      const adminId = await createAdminUser();
      const transformed = buildTransformed(FIXTURE_SQL);
      await runImport(adminId, transformed);

      const recipes = await Recipe.find().lean().exec();
      expect(recipes).toHaveLength(2);
      for (const recipe of recipes) {
        expect(String(recipe.userId)).toBe(adminId);
      }
    });
  });

  it("all imported cookbooks are owned by the default admin user", async () => {
    await withCleanDb(async () => {
      const adminId = await createAdminUser();
      const transformed = buildTransformed(FIXTURE_SQL);
      await runImport(adminId, transformed);

      const cookbooks = await Cookbook.find().lean().exec();
      expect(cookbooks).toHaveLength(1);
      expect(String(cookbooks[0].userId)).toBe(adminId);
    });
  });

  it("all imported recipes are queryable as public", async () => {
    await withCleanDb(async () => {
      const adminId = await createAdminUser();
      const transformed = buildTransformed(FIXTURE_SQL);
      await runImport(adminId, transformed);

      const publicRecipes = await Recipe.find({ isPublic: true }).lean().exec();
      expect(publicRecipes).toHaveLength(2);
    });
  });

  it("cookbook recipe entries respect insertion order via ascending orderIndex", async () => {
    await withCleanDb(async () => {
      const adminId = await createAdminUser();
      const transformed = buildTransformed(FIXTURE_SQL);
      await runImport(adminId, transformed);

      const cookbook = await Cookbook.findOne().lean().exec();
      expect(cookbook).not.toBeNull();
      const entries = cookbook!.recipes as Array<{
        recipeId: unknown;
        orderIndex: number;
      }>;
      expect(entries).toHaveLength(2);
      expect(entries[0].orderIndex).toBe(0);
      expect(entries[1].orderIndex).toBe(1);

      // cookbook_recipes inserts recipe 2 first (orderIndex 0) then recipe 1
      const recipe2Id = deterministicObjectId("recipe", 2);
      const recipe1Id = deterministicObjectId("recipe", 1);
      expect(String(entries[0].recipeId)).toBe(recipe2Id);
      expect(String(entries[1].recipeId)).toBe(recipe1Id);
    });
  });

  it("recipes can be filtered by meal association", async () => {
    await withCleanDb(async () => {
      const adminId = await createAdminUser();
      const transformed = buildTransformed(FIXTURE_SQL);
      await runImport(adminId, transformed);

      // Both fixture recipes are linked to meal 1 in recipe_meals
      const mealObjectId = new Types.ObjectId(deterministicObjectId("meal", 1));
      const recipesForMeal = await Recipe.find({ mealIds: mealObjectId })
        .lean()
        .exec();
      expect(recipesForMeal).toHaveLength(2);
    });
  });

  it("fixture SQL contains no legacy image migration requirement", () => {
    const extracted = extractTables(FIXTURE_SQL, TARGET_TABLES);
    // buildImageAudit accepts any Record<string, { schema: { columns }, rows }>
    const audit = buildImageAudit(
      extracted as Parameters<typeof buildImageAudit>[0],
    );
    expect(audit.requiresImageMigration).toBe(false);
    expect(audit.outcome).toBe("no-image-migration-required");
  });
});
