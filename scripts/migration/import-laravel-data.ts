import { config } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  resolveDefaultAdminUser,
  type AdminResolution,
} from "./lib/defaultAdmin";
import {
  prepareCookbookDocument,
  prepareRecipeDocument,
  prepareTaxonomyDocument,
  type CookbookDocument,
  type FailureRecord,
  type RecipeDocument,
  type TaxonomyDocument,
} from "./lib/importHelpers";

if (process.env.DOTENV_PATH) {
  config({ path: process.env.DOTENV_PATH, override: true });
} else {
  config({ path: ".env.local" });
  config({ path: ".env.test" });
  config();
}

const repoRoot = process.cwd();
const transformedDir = resolve(repoRoot, "data/legacy-migration/transformed");
const reportsDir = resolve(repoRoot, "data/legacy-migration/reports");

type MigrationStatus = "success" | "partial-failure" | "blocking-failure";

interface CollectionReport {
  inputCount: number;
  readyCount: number;
  skippedCount: number;
  matchedCount: number;
  modifiedCount: number;
  upsertedCount: number;
}

async function main() {
  const report = {
    importedAt: new Date().toISOString(),
    status: "success" as MigrationStatus,
    adminResolution: null as AdminResolution | null,
    collections: {} as Record<string, CollectionReport>,
    partialFailures: [] as FailureRecord[],
    blockingFailures: [] as FailureRecord[],
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
      User,
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
      User,
      Types.ObjectId,
      "migration:import",
    );
    report.adminResolution = adminResolution;
    const [
      classifications,
      sources,
      meals,
      courses,
      preparations,
      recipes,
      cookbooks,
    ] = await Promise.all([
      readJson<TaxonomyDocument[]>(
        resolve(transformedDir, "classifications.json"),
      ),
      readJson<TaxonomyDocument[]>(resolve(transformedDir, "sources.json")),
      readJson<TaxonomyDocument[]>(resolve(transformedDir, "meals.json")),
      readJson<TaxonomyDocument[]>(resolve(transformedDir, "courses.json")),
      readJson<TaxonomyDocument[]>(
        resolve(transformedDir, "preparations.json"),
      ),
      readJson<RecipeDocument[]>(resolve(transformedDir, "recipes.json")),
      readJson<CookbookDocument[]>(resolve(transformedDir, "cookbooks.json")),
    ]);

    await detectUniqueConflicts(
      Classification,
      classifications,
      "slug",
      "classifications",
      report,
    );
    await detectUniqueConflicts(Meal, meals, "slug", "meals", report, true);
    await detectUniqueConflicts(Course, courses, "slug", "courses", report, true);
    await detectUniqueConflicts(
      Preparation,
      preparations,
      "slug",
      "preparations",
      report,
      true,
    );

    if (report.blockingFailures.length === 0) {
    await importCollection(
      "classifications",
      Classification,
      classifications,
      (document) =>
        prepareTaxonomyDocument(
          document,
          Types.ObjectId,
          "classifications",
          false,
        ),
      report,
    );
    await importCollection(
      "sources",
      Source,
      sources,
      (document) =>
        prepareTaxonomyDocument(document, Types.ObjectId, "sources", true),
      report,
    );
    await importCollection(
      "meals",
      Meal,
      meals,
      (document) =>
        prepareTaxonomyDocument(document, Types.ObjectId, "meals", false),
      report,
    );
    await importCollection(
      "courses",
      Course,
      courses,
      (document) =>
        prepareTaxonomyDocument(document, Types.ObjectId, "courses", false),
      report,
    );
    await importCollection(
      "preparations",
      Preparation,
      preparations,
      (document) =>
        prepareTaxonomyDocument(
          document,
          Types.ObjectId,
          "preparations",
          false,
        ),
      report,
    );
    await importCollection(
      "recipes",
      Recipe,
      recipes,
      (document) =>
        prepareRecipeDocument(
          document,
          adminResolution.resolvedId,
          Types.ObjectId,
        ),
      report,
    );
    await importCollection(
      "cookbooks",
      Cookbook,
      cookbooks,
      (document) =>
        prepareCookbookDocument(
          document,
          adminResolution.resolvedId,
          Types.ObjectId,
        ),
      report,
    );
    } // end if (report.blockingFailures.length === 0)
  } catch (error) {
    report.blockingFailures.push({
      severity: "blocking",
      collection: "migration",
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  if (report.blockingFailures.length > 0) {
    report.status = "blocking-failure";
  } else if (report.partialFailures.length > 0) {
    report.status = "partial-failure";
  }

  await writeJson(resolve(reportsDir, "import-report.json"), report);

  if (mongooseInstance?.connection.readyState === 1) {
    await mongooseInstance.disconnect();
  }

  if (report.status !== "success") {
    console.error(
      `Migration import finished with status ${report.status}. See data/legacy-migration/reports/import-report.json`,
    );
    process.exit(1);
  }

  console.log("Imported transformed legacy artifacts into MongoDB");
  process.exit(0);
}

async function detectUniqueConflicts(
  model: {
    find: (filter: Record<string, unknown>) => {
      lean: () => { exec: () => Promise<Array<Record<string, unknown>>> };
    };
    deleteMany?: (filter: Record<string, unknown>) => Promise<unknown>;
  },
  documents: TaxonomyDocument[],
  field: "slug",
  collectionName: string,
  report: {
    blockingFailures: FailureRecord[];
  },
  resolveByDeleting = false,
) {
  const expectedIds = documents.map((document) => document._id);
  const values = Array.from(
    new Set(
      documents
        .map((document) => document[field])
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (values.length === 0) {
    return;
  }

  const conflicts = await model
    .find({ [field]: { $in: values }, _id: { $nin: expectedIds } })
    .lean()
    .exec();

  if (conflicts.length === 0) {
    return;
  }

  if (resolveByDeleting && model.deleteMany) {
    const conflictingSlugs = conflicts.map((c) => String(c[field]));
    await model.deleteMany({ [field]: { $in: conflictingSlugs } });
    return;
  }

  for (const conflict of conflicts) {
    report.blockingFailures.push({
      severity: "blocking",
      collection: collectionName,
      reason: `Existing ${collectionName} document conflicts on ${field}=${String(conflict[field])} with _id=${String(conflict._id)}. Import requires a clean target or manual reconciliation.`,
    });
  }
}

async function importCollection<TDocument>(
  collectionName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: import("mongoose").Model<any>,
  documents: TDocument[],
  prepare: (document: TDocument) => {
    document: Record<string, unknown> | null;
    failure?: FailureRecord;
  },
  report: {
    collections: Record<string, CollectionReport>;
    partialFailures: FailureRecord[];
  },
) {
  const preparedDocuments: Record<string, unknown>[] = [];
  const failures: FailureRecord[] = [];

  for (const document of documents) {
    const result = prepare(document);

    if (result.failure) {
      failures.push(result.failure);
      continue;
    }

    if (result.document) {
      preparedDocuments.push(result.document);
    }
  }

  report.partialFailures.push(...failures);

  const operations = preparedDocuments.map((document) => ({
    replaceOne: {
      filter: { _id: document._id },
      replacement: document,
      upsert: true,
    },
  }));

  let matchedCount = 0;
  let modifiedCount = 0;
  let upsertedCount = 0;

  if (operations.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await model.collection.bulkWrite(operations as any[], {
      ordered: true,
    });
    matchedCount = result.matchedCount;
    modifiedCount = result.modifiedCount;
    upsertedCount = result.upsertedCount;
  }

  report.collections[collectionName] = {
    inputCount: documents.length,
    readyCount: preparedDocuments.length,
    skippedCount: failures.length,
    matchedCount,
    modifiedCount,
    upsertedCount,
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
