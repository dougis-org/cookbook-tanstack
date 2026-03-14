export interface DumpColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface DumpForeignKey {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface DumpTableSchema {
  name: string;
  columns: DumpColumn[];
  foreignKeys: DumpForeignKey[];
}

export interface ExtractedTable {
  schema: DumpTableSchema;
  rows: Record<string, unknown>[];
}

export const TARGET_TABLES = [
  "classifications",
  "cookbook_recipes",
  "cookbooks",
  "courses",
  "meals",
  "preparations",
  "recipe_courses",
  "recipe_meals",
  "recipe_preparations",
  "recipes",
  "sources",
] as const;

export function parseDumpSchemas(sql: string): Map<string, DumpTableSchema> {
  const schemas = new Map<string, DumpTableSchema>();
  const createTablePattern = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\) ENGINE=/g;

  for (const match of sql.matchAll(createTablePattern)) {
    const [, tableName, body] = match;
    const columns: DumpColumn[] = [];
    const foreignKeys: DumpForeignKey[] = [];

    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim().replace(/,$/, "");

      if (line.startsWith("`")) {
        const columnMatch = /^`([^`]+)`\s+(.+)$/.exec(line);

        if (!columnMatch) {
          continue;
        }

        const [, name, typeAndConstraints] = columnMatch;
        const typeMatch = /^([^\s,]+(?:\([^)]*\))?)/.exec(typeAndConstraints);

        columns.push({
          name,
          type: typeMatch?.[1] ?? typeAndConstraints,
          nullable: !typeAndConstraints.includes("NOT NULL"),
        });

        continue;
      }

      const foreignKeyMatch =
        /^CONSTRAINT `([^`]+)` FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)` \(`([^`]+)`\)/.exec(
          line,
        );

      if (!foreignKeyMatch) {
        continue;
      }

      const [, name, column, referencedTable, referencedColumn] =
        foreignKeyMatch;

      foreignKeys.push({
        name,
        column,
        referencedTable,
        referencedColumn,
      });
    }

    schemas.set(tableName, {
      name: tableName,
      columns,
      foreignKeys,
    });
  }

  return schemas;
}

export function extractTableRows(sql: string, tableName: string): unknown[][] {
  const rows: unknown[][] = [];

  for (const valuesBlock of findInsertBlocks(sql, tableName)) {
    rows.push(...parseInsertValues(valuesBlock));
  }

  return rows;
}

export function extractTables(
  sql: string,
  tableNames: readonly string[],
): Record<string, ExtractedTable> {
  const schemas = parseDumpSchemas(sql);
  const extracted: Record<string, ExtractedTable> = {};

  for (const tableName of tableNames) {
    const schema = schemas.get(tableName);

    if (!schema) {
      throw new Error(`Missing CREATE TABLE statement for ${tableName}`);
    }

    const rawRows = extractTableRows(sql, tableName);
    const rows = rawRows.map((values, index) => {
      if (values.length !== schema.columns.length) {
        throw new Error(
          `Column mismatch for ${tableName} row ${index + 1}: expected ${schema.columns.length}, received ${values.length}`,
        );
      }

      return Object.fromEntries(
        schema.columns.map((column, columnIndex) => [
          column.name,
          values[columnIndex],
        ]),
      );
    });

    extracted[tableName] = { schema, rows };
  }

  return extracted;
}

function parseInsertValues(valuesBlock: string): unknown[][] {
  const rows: unknown[][] = [];
  let currentRow: unknown[] = [];
  let currentValue = "";
  let inString = false;
  let inRow = false;
  let escapeNext = false;
  let quotedValue = false;

  for (let index = 0; index < valuesBlock.length; index += 1) {
    const character = valuesBlock[index];

    if (inString) {
      if (escapeNext) {
        currentValue += decodeEscapedCharacter(character);
        escapeNext = false;
        continue;
      }

      if (character === "\\") {
        escapeNext = true;
        continue;
      }

      if (character === "'") {
        inString = false;
        continue;
      }

      currentValue += character;
      continue;
    }

    if (character === "'") {
      if (currentValue.trim() === "") {
        currentValue = "";
      }

      inString = true;
      quotedValue = true;
      continue;
    }

    if (character === "(") {
      inRow = true;
      currentRow = [];
      currentValue = "";
      quotedValue = false;
      continue;
    }

    if (!inRow) {
      continue;
    }

    if (character === ",") {
      currentRow.push(normalizeToken(currentValue, quotedValue));
      currentValue = "";
      quotedValue = false;
      continue;
    }

    if (character === ")") {
      currentRow.push(normalizeToken(currentValue, quotedValue));
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      quotedValue = false;
      inRow = false;
      continue;
    }

    currentValue += character;
  }

  return rows;
}

function findInsertBlocks(sql: string, tableName: string): string[] {
  const marker = `INSERT INTO \`${tableName}\` VALUES `;
  const blocks: string[] = [];
  let searchIndex = 0;

  while (searchIndex < sql.length) {
    const start = sql.indexOf(marker, searchIndex);

    if (start === -1) {
      break;
    }

    let index = start + marker.length;
    let inString = false;
    let escapeNext = false;

    for (; index < sql.length; index += 1) {
      const character = sql[index];

      if (inString) {
        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (character === "\\") {
          escapeNext = true;
          continue;
        }

        if (character === "'") {
          inString = false;
        }

        continue;
      }

      if (character === "'") {
        inString = true;
        continue;
      }

      if (character === ";") {
        blocks.push(sql.slice(start + marker.length, index));
        searchIndex = index + 1;
        break;
      }
    }
  }

  return blocks;
}

function normalizeToken(token: string, quotedValue: boolean): unknown {
  if (quotedValue) {
    return token;
  }

  const trimmed = token.trim();

  if (trimmed === "NULL") {
    return null;
  }

  if (trimmed === "") {
    return null;
  }

  if (/^-?\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10);
  }

  if (/^-?\d+\.\d+$/.test(trimmed)) {
    return Number.parseFloat(trimmed);
  }

  return trimmed;
}

function decodeEscapedCharacter(character: string): string {
  switch (character) {
    case "0":
      return "\0";
    case "b":
      return "\b";
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "\t";
    case "Z":
      return "\x1a";
    default:
      return character;
  }
}
