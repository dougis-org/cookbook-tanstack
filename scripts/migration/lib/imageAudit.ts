export interface ExtractedTableSchema {
  name: string;
  columns: Array<{ name: string }>;
}

export interface ExtractedTable {
  schema: ExtractedTableSchema;
  rows: Array<Record<string, unknown>>;
}

export function buildImageAudit(
  extractedTables: Record<string, ExtractedTable>,
) {
  const auditedTables = ["recipes", "cookbooks"];
  const tableFindings = auditedTables.map((tableName) => {
    const table = extractedTables[tableName];
    const candidateColumns = table.schema.columns
      .map((column) => column.name)
      .filter((columnName) =>
        /image|photo|picture|thumbnail|media|asset/i.test(columnName),
      );

    const populatedColumns = candidateColumns.flatMap((columnName) => {
      const populatedRows = table.rows.filter((row) =>
        hasImageValue(row[columnName]),
      );

      if (populatedRows.length === 0) {
        return [];
      }

      return [
        {
          columnName,
          populatedRowCount: populatedRows.length,
          sampleLegacyIds: populatedRows.slice(0, 10).map((row) => row.id),
        },
      ];
    });

    return {
      tableName,
      candidateColumns,
      populatedColumns,
    };
  });

  const requiresImageMigration = tableFindings.some(
    (finding) => finding.populatedColumns.length > 0,
  );

  return {
    requiresImageMigration,
    outcome: requiresImageMigration
      ? "review-required"
      : "no-image-migration-required",
    rationale: requiresImageMigration
      ? "Legacy image-bearing columns were detected with populated values."
      : "No legacy recipe or cookbook image-bearing columns with populated values were detected.",
    tableFindings,
  };
}

export function hasImageValue(value: unknown) {
  return typeof value === "string"
    ? value.trim().length > 0
    : value !== null && value !== undefined;
}
