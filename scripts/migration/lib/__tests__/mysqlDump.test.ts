import { describe, expect, it } from "vitest";

import { extractTables } from "../mysqlDump";

describe("mysqlDump parser", () => {
  it("preserves semicolons inside quoted string values", () => {
    const sql = [
      "CREATE TABLE `recipes` (",
      "  `id` int NOT NULL,",
      "  `name` varchar(255) NOT NULL,",
      "  `instructions` text,",
      "  PRIMARY KEY (`id`)",
      ") ENGINE=InnoDB;",
      `INSERT INTO \`recipes\` VALUES (1, 'Cake', 'Mix; bake; serve'),`,
      `  (2, 'Pie', 'Slice and serve');`,
    ].join("\n");

    const tables = extractTables(sql, ["recipes"]);

    expect(tables.recipes.rows).toEqual([
      { id: 1, name: "Cake", instructions: "Mix; bake; serve" },
      { id: 2, name: "Pie", instructions: "Slice and serve" },
    ]);
  });
});
