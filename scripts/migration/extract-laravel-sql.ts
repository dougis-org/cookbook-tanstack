import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildImageAudit, type ExtractedTable } from "./lib/imageAudit";
import { TARGET_TABLES, extractTables } from "./lib/mysqlDump";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");
const dumpPath = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : resolve(repoRoot, "dump-recipe_laravel-202603111712.sql");
const workspaceRoot = resolve(repoRoot, "data/legacy-migration");
const extractedDir = resolve(workspaceRoot, "extracted");
const manifestsDir = resolve(workspaceRoot, "manifests");
const reportsDir = resolve(workspaceRoot, "reports");

async function main() {
  const sql = await readFile(dumpPath, "utf8");
  const extractedTables = extractTables(sql, TARGET_TABLES);
  const imageAudit = buildImageAudit(
    extractedTables as Record<string, ExtractedTable>,
  );

  await Promise.all([
    mkdir(extractedDir, { recursive: true }),
    mkdir(manifestsDir, { recursive: true }),
    mkdir(reportsDir, { recursive: true }),
  ]);

  for (const tableName of TARGET_TABLES) {
    const table = extractedTables[tableName];

    await writeJson(resolve(extractedDir, `${tableName}.json`), table.rows);
  }

  await writeJson(
    resolve(manifestsDir, "schema.json"),
    Object.fromEntries(
      Object.entries(extractedTables).map(([tableName, table]) => [
        tableName,
        table.schema,
      ]),
    ),
  );

  await writeJson(resolve(reportsDir, "extraction-summary.json"), {
    dumpPath,
    extractedAt: new Date().toISOString(),
    tables: TARGET_TABLES.map((tableName) => ({
      tableName,
      rowCount: extractedTables[tableName].rows.length,
      columnCount: extractedTables[tableName].schema.columns.length,
      foreignKeyCount: extractedTables[tableName].schema.foreignKeys.length,
    })),
    totalRows: TARGET_TABLES.reduce(
      (sum, tableName) => sum + extractedTables[tableName].rows.length,
      0,
    ),
  });

  await writeJson(resolve(reportsDir, "image-audit.json"), {
    dumpPath,
    auditedAt: new Date().toISOString(),
    ...imageAudit,
  });

  console.log(
    `Extracted ${TARGET_TABLES.length} tables from ${dumpPath} into data/legacy-migration/extracted`,
  );
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
