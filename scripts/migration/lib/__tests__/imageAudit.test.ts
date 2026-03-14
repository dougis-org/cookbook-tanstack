import { describe, expect, it } from "vitest";

import { buildImageAudit } from "../imageAudit";

describe("image audit", () => {
  it("reports no-image migration when no image-bearing columns exist", () => {
    const audit = buildImageAudit({
      recipes: {
        schema: {
          name: "recipes",
          columns: [{ name: "id" }, { name: "name" }],
        },
        rows: [{ id: 1, name: "Cake" }],
      },
      cookbooks: {
        schema: {
          name: "cookbooks",
          columns: [{ name: "id" }, { name: "name" }],
        },
        rows: [{ id: 2, name: "Desserts" }],
      },
    });

    expect(audit.requiresImageMigration).toBe(false);
    expect(audit.outcome).toBe("no-image-migration-required");
  });

  it("requires review when populated image fields are present", () => {
    const audit = buildImageAudit({
      recipes: {
        schema: {
          name: "recipes",
          columns: [{ name: "id" }, { name: "image_url" }],
        },
        rows: [{ id: 1, image_url: "https://example.com/cake.jpg" }],
      },
      cookbooks: {
        schema: { name: "cookbooks", columns: [{ name: "id" }] },
        rows: [{ id: 2 }],
      },
    });

    expect(audit.requiresImageMigration).toBe(true);
    expect(audit.outcome).toBe("review-required");
    expect(audit.tableFindings[0].populatedColumns[0]).toMatchObject({
      columnName: "image_url",
      populatedRowCount: 1,
      sampleLegacyIds: [1],
    });
  });
});
