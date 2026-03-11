import { describe, it, expect } from "vitest";
import type { Recipe } from "@/types/recipe";
import { exportRecipeToJson } from "@/lib/export";

function makeRecipe(overrides: Partial<Record<string, unknown>> = {}): Recipe {
  return {
    id: "test-id",
    userId: "user-1",
    name: "Test Recipe",
    ingredients: "2 cups flour",
    instructions: "Mix and bake",
    notes: "Great recipe",
    servings: 4,
    prepTime: 10,
    cookTime: 20,
    difficulty: "easy",
    sourceId: "source-1",
    classificationId: "class-1",
    dateAdded: new Date("2025-01-01T00:00:00.000Z"),
    calories: 120,
    fat: 4,
    cholesterol: 10,
    sodium: 15,
    protein: 5,
    marked: false,
    imageUrl: "https://example.com/recipe.jpg",
    isPublic: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-02T00:00:00.000Z"),
    ...overrides,
  } as Recipe;
}

describe("exportRecipeToJson", () => {
  it("includes recipe fields in the exported JSON", () => {
    const recipe = makeRecipe();
    const json = exportRecipeToJson(recipe);
    const parsed = JSON.parse(json);

    expect(parsed.name).toBe("Test Recipe");
    expect(parsed.ingredients).toBe("2 cups flour");
    expect(parsed.instructions).toBe("Mix and bake");
    expect(parsed.servings).toBe(4);
    expect(parsed.difficulty).toBe("easy");
  });

  it("includes _version field with value 1", () => {
    const recipe = makeRecipe();
    const json = exportRecipeToJson(recipe);
    const parsed = JSON.parse(json);

    expect(parsed._version).toBe("1");
  });

  it("returns valid pretty-printed JSON", () => {
    const recipe = makeRecipe();
    const json = exportRecipeToJson(recipe);

    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain('\n  "name":');
  });
});
