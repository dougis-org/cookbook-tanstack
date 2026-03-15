import { config } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { resolveDefaultAdminUser } from "./lib/defaultAdmin";

if (process.env.DOTENV_PATH) {
  config({ path: process.env.DOTENV_PATH, override: true });
} else {
  config({ path: ".env.local" });
  config({ path: ".env.test" });
  config();
}

const repoRoot = process.cwd();
const extractedDir = resolve(repoRoot, "data/legacy-migration/extracted");
const manifestsDir = resolve(repoRoot, "data/legacy-migration/manifests");
const reportsDir = resolve(repoRoot, "data/legacy-migration/reports");

interface VerificationFailure {
  check: string;
  severity: "blocking" | "warning";
  reason: string;
}

async function main() {
  const report = {
    verifiedAt: new Date().toISOString(),
    status: "pass" as "pass" | "fail",
    adminResolution: null as null | {
      lookupMode: "id" | "email" | "username";
      lookupValue: string;
      resolvedId: string;
      email: string;
      username: string;
    },
    extractedCounts: null as null | Awaited<
      ReturnType<typeof loadExtractedCounts>
    >,
    collectionChecks: {} as Record<
      string,
      { expectedCount: number; importedCount: number; passed: boolean }
    >,
    representativeQueryChecks: {} as Record<string, number>,
    imageAudit: null as Record<string, unknown> | null,
    failures: [] as VerificationFailure[],
  };
  let mongooseInstance: {
    connection: { readyState: number };
    disconnect: () => Promise<void>;
  } | null = null;

  try {
    const { Types } = await import("mongoose");
    const { default: mongoose } = await import("../../src/db/index");
    mongooseInstance = mongoose;
    const {
      Classification,
      Source,
      Meal,
      Course,
      Preparation,
      Recipe,
      Cookbook,
    } = await import("../../src/db/models");

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise();
    }

    const adminResolution = await resolveDefaultAdminUser(
      Types.ObjectId,
      "migration:verify-import",
    );
    report.adminResolution = adminResolution;
    const extractedCounts = await loadExtractedCounts();
    report.extractedCounts = extractedCounts;
    const idMap = await readJson<Record<string, Record<string, string>>>(
      resolve(manifestsDir, "legacy-id-map.json"),
    );
    const imageAudit = await readJson<Record<string, unknown>>(
      resolve(reportsDir, "image-audit.json"),
    );
    report.imageAudit = imageAudit;

    const failures: VerificationFailure[] = [];

    const collectionChecks = {
      classifications: await countImportedByIdMap(
        Classification,
        idMap.classifications,
        extractedCounts.classifications,
      ),
      sources: await countImportedByIdMap(
        Source,
        idMap.sources,
        extractedCounts.sources,
      ),
      meals: await countImportedByIdMap(
        Meal,
        idMap.meals,
        extractedCounts.meals,
      ),
      courses: await countImportedByIdMap(
        Course,
        idMap.courses,
        extractedCounts.courses,
      ),
      preparations: await countImportedByIdMap(
        Preparation,
        idMap.preparations,
        extractedCounts.preparations,
      ),
      recipes: await countImportedByIdMap(
        Recipe,
        idMap.recipes,
        extractedCounts.recipes,
      ),
      cookbooks: await countImportedByIdMap(
        Cookbook,
        idMap.cookbooks,
        extractedCounts.cookbooks,
      ),
    };
    report.collectionChecks = collectionChecks;

    for (const [collectionName, check] of Object.entries(collectionChecks)) {
      if (!check.passed) {
        failures.push({
          check: `${collectionName}-count`,
          severity: "blocking",
          reason: `${collectionName} imported ${check.importedCount} records for expected ids; expected ${check.expectedCount}.`,
        });
      }
    }

    const expectedAdminObjectId = new Types.ObjectId(
      adminResolution.resolvedId,
    );
    const recipeOwnershipFailures = await Recipe.countDocuments({
      _id: {
        $in: Object.values(idMap.recipes).map(
          (value) => new Types.ObjectId(value),
        ),
      },
      userId: { $ne: expectedAdminObjectId },
    });

    if (recipeOwnershipFailures > 0) {
      failures.push({
        check: "recipes-default-admin-ownership",
        severity: "blocking",
        reason: `${recipeOwnershipFailures} imported recipes do not point to the configured default admin user.`,
      });
    }

    const cookbookOwnershipFailures = await Cookbook.countDocuments({
      _id: {
        $in: Object.values(idMap.cookbooks).map(
          (value) => new Types.ObjectId(value),
        ),
      },
      userId: { $ne: expectedAdminObjectId },
    });

    if (cookbookOwnershipFailures > 0) {
      failures.push({
        check: "cookbooks-default-admin-ownership",
        severity: "blocking",
        reason: `${cookbookOwnershipFailures} imported cookbooks do not point to the configured default admin user.`,
      });
    }

    const cookbookOrderIssues = await Cookbook.aggregate([
      {
        $match: {
          _id: {
            $in: Object.values(idMap.cookbooks).map(
              (value) => new Types.ObjectId(value),
            ),
          },
        },
      },
      { $unwind: { path: "$recipes", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          recipeCount: {
            $sum: { $cond: [{ $ifNull: ["$recipes", false] }, 1, 0] },
          },
          orderIndexes: { $push: "$recipes.orderIndex" },
        },
      },
    ]);

    const invalidCookbookOrders = cookbookOrderIssues.filter((cookbook) => {
      const normalized = cookbook.orderIndexes
        .filter((value: unknown) => typeof value === "number")
        .sort((left: number, right: number) => left - right);
      return normalized.some((value: number, index: number) => value !== index);
    });

    if (invalidCookbookOrders.length > 0) {
      failures.push({
        check: "cookbook-ordering",
        severity: "blocking",
        reason: `${invalidCookbookOrders.length} imported cookbooks have non-contiguous orderIndex values.`,
      });
    }

    const representativeQueryChecks = {
      publicRecipesVisible: await Recipe.countDocuments({
        _id: {
          $in: Object.values(idMap.recipes).map(
            (value) => new Types.ObjectId(value),
          ),
        },
        isPublic: true,
      }),
      recipesWithMeals: await Recipe.countDocuments({
        _id: {
          $in: Object.values(idMap.recipes).map(
            (value) => new Types.ObjectId(value),
          ),
        },
        mealIds: { $exists: true, $ne: [] },
      }),
      cookbooksWithEntries: await Cookbook.countDocuments({
        _id: {
          $in: Object.values(idMap.cookbooks).map(
            (value) => new Types.ObjectId(value),
          ),
        },
        "recipes.0": { $exists: true },
      }),
    };
    report.representativeQueryChecks = representativeQueryChecks;

    if (representativeQueryChecks.publicRecipesVisible === 0) {
      failures.push({
        check: "public-recipe-query",
        severity: "blocking",
        reason:
          "No imported public recipes are visible to representative query checks.",
      });
    }

    if (representativeQueryChecks.recipesWithMeals === 0) {
      failures.push({
        check: "recipe-filter-query",
        severity: "blocking",
        reason: "No imported recipes retained meal taxonomy relationships.",
      });
    }

    report.failures = failures;
    report.status = failures.some((failure) => failure.severity === "blocking")
      ? "fail"
      : "pass";
  } catch (error) {
    report.status = "fail";
    report.failures.push({
      check: "verification-runtime",
      severity: "blocking",
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  await writeJson(resolve(reportsDir, "verification-report.json"), report);

  if (mongooseInstance?.connection.readyState === 1) {
    await mongooseInstance.disconnect();
  }

  if (report.status !== "pass") {
    console.error(
      "Migration verification failed. See data/legacy-migration/reports/verification-report.json",
    );
    process.exit(1);
  }

  console.log("Migration verification passed");
  process.exit(0);
}

async function loadExtractedCounts() {
  return {
    classifications: (
      await readJson<unknown[]>(resolve(extractedDir, "classifications.json"))
    ).length,
    sources: (await readJson<unknown[]>(resolve(extractedDir, "sources.json")))
      .length,
    meals: (await readJson<unknown[]>(resolve(extractedDir, "meals.json")))
      .length,
    courses: (await readJson<unknown[]>(resolve(extractedDir, "courses.json")))
      .length,
    preparations: (
      await readJson<unknown[]>(resolve(extractedDir, "preparations.json"))
    ).length,
    recipes: (await readJson<unknown[]>(resolve(extractedDir, "recipes.json")))
      .length,
    cookbooks: (
      await readJson<unknown[]>(resolve(extractedDir, "cookbooks.json"))
    ).length,
  };
}

async function countImportedByIdMap(
  model: {
    countDocuments: (filter: Record<string, unknown>) => Promise<number>;
  },
  mapping: Record<string, string>,
  expectedCount: number,
) {
  const { Types } = await import("mongoose");
  const importedCount = await model.countDocuments({
    _id: {
      $in: Object.values(mapping).map((value) => new Types.ObjectId(value)),
    },
  });

  return {
    expectedCount,
    importedCount,
    passed: importedCount === expectedCount,
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
