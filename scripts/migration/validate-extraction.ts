import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { TARGET_TABLES, extractTables } from "./lib/mysqlDump";

const repoRoot = process.cwd();
const dumpPath = resolve(repoRoot, "dump-recipe_laravel-202603111712.sql");
const extractedDir = resolve(repoRoot, "data/legacy-migration/extracted");
const manifestsDir = resolve(repoRoot, "data/legacy-migration/manifests");
const reportsDir = resolve(repoRoot, "data/legacy-migration/reports");

async function main() {
  const sql = await readFile(dumpPath, "utf8");
  const expectedTables = extractTables(sql, TARGET_TABLES);
  const schemaManifest = await readJson<Record<string, unknown>>(
    resolve(manifestsDir, "schema.json"),
  );

  const tableChecks = [];
  let isValid = true;

  for (const tableName of TARGET_TABLES) {
    const extractedRows = await readJson<Record<string, unknown>[]>(
      resolve(extractedDir, `${tableName}.json`),
    );
    const expected = expectedTables[tableName];
    const schemaMatches =
      JSON.stringify(schemaManifest[tableName]) ===
      JSON.stringify(expected.schema);

    const countsMatch = extractedRows.length === expected.rows.length;

    tableChecks.push({
      tableName,
      extractedRowCount: extractedRows.length,
      expectedRowCount: expected.rows.length,
      countsMatch,
      schemaMatches,
    });

    if (!countsMatch || !schemaMatches) {
      isValid = false;
    }
  }

  const foreignKeyChecks = TARGET_TABLES.flatMap((tableName) => {
    const { schema, rows } = expectedTables[tableName];

    return schema.foreignKeys.map((foreignKey) => {
      const referencedRows =
        expectedTables[foreignKey.referencedTable]?.rows ?? [];
      const referencedValues = new Set(
        referencedRows.map((row) =>
          normalizeKey(row[foreignKey.referencedColumn]),
        ),
      );

      const missingReferences = rows
        .filter((row) => isReferenceValue(row[foreignKey.column]))
        .filter(
          (row) =>
            !referencedValues.has(normalizeKey(row[foreignKey.column])) &&
            normalizeKey(row[foreignKey.column]) !== null,
        )
        .map((row) => row.id);

      if (missingReferences.length > 0) {
        isValid = false;
      }

      return {
        tableName,
        foreignKey: foreignKey.name,
        column: foreignKey.column,
        referencedTable: foreignKey.referencedTable,
        referencedColumn: foreignKey.referencedColumn,
        missingReferenceCount: missingReferences.length,
        sampleRowIds: missingReferences.slice(0, 10),
      };
    });
  });

  const report = {
    dumpPath,
    validatedAt: new Date().toISOString(),
    isValid,
    requiredTables: [...TARGET_TABLES],
    tableChecks,
    foreignKeyChecks,
  };

  await writeFile(
    resolve(reportsDir, "extraction-validation.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  if (!isValid) {
    console.error(
      "Extraction validation failed. See data/legacy-migration/reports/extraction-validation.json",
    );
    process.exitCode = 1;
    return;
  }

  console.log("Extraction validation passed");
}

function isReferenceValue(value: unknown) {
  return value !== null && value !== 0 && value !== "0";
}

function normalizeKey(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
