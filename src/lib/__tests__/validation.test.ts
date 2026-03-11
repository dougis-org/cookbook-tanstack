import { describe, it, expect } from "vitest";
import { importedRecipeSchema } from "@/lib/validation";
import { RECIPE_EXPORT_VERSION } from "@/lib/export";

describe("importedRecipeSchema", () => {
  it("accepts valid exported recipe JSON", () => {
    const result = importedRecipeSchema.safeParse({
      name: "Imported Recipe",
      ingredients: "1 cup flour",
      instructions: "Mix well",
      servings: 2,
      difficulty: "easy",
      _version: RECIPE_EXPORT_VERSION,
      isPublic: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects payloads missing required fields", () => {
    const result = importedRecipeSchema.safeParse({
      instructions: "Missing name",
      _version: RECIPE_EXPORT_VERSION,
    });

    expect(result.success).toBe(false);
  });

  it("rejects payloads with wrong field types", () => {
    const result = importedRecipeSchema.safeParse({
      name: "Bad Recipe",
      servings: "four",
      _version: RECIPE_EXPORT_VERSION,
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid dateAdded strings", () => {
    const result = importedRecipeSchema.safeParse({
      name: "Bad Date Recipe",
      dateAdded: "not-a-date",
      _version: RECIPE_EXPORT_VERSION,
    });

    expect(result.success).toBe(false);
  });
});
