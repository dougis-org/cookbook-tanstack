import mongoose from "mongoose";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_ADMIN_PLACEHOLDER,
  prepareCookbookDocument,
  prepareRecipeDocument,
  prepareTaxonomyDocument,
} from "../importHelpers";

describe("import helpers", () => {
  it("quarantines taxonomy records without a required name", () => {
    const result = prepareTaxonomyDocument(
      {
        _id: "42b43066f0148028c8ee5b36",
        legacyId: 1,
        name: null,
        slug: "dessert",
        createdAt: null,
        updatedAt: null,
      },
      mongoose.Types.ObjectId,
      "classifications",
      false,
    );

    expect(result.document).toBeNull();
    expect(result.failure).toMatchObject({
      collection: "classifications",
      legacyId: 1,
      severity: "partial",
    });
  });

  it("rejects recipes with unexpected ownership placeholders", () => {
    const result = prepareRecipeDocument(
      {
        _id: "42b43066f0148028c8ee5b36",
        legacyId: 2,
        userId: "not-the-placeholder",
        legacyOwnerId: null,
        legacyOwnerSource: null,
        name: "Cake",
        ingredients: null,
        instructions: null,
        notes: null,
        servings: null,
        prepTime: null,
        cookTime: null,
        difficulty: null,
        sourceId: null,
        classificationId: null,
        dateAdded: null,
        calories: null,
        fat: null,
        cholesterol: null,
        sodium: null,
        protein: null,
        imageUrl: null,
        isPublic: true,
        marked: false,
        mealIds: [],
        courseIds: [],
        preparationIds: [],
        createdAt: null,
        updatedAt: null,
      },
      "507f1f77bcf86cd799439011",
      mongoose.Types.ObjectId,
    );

    expect(result.document).toBeNull();
    expect(result.failure?.reason).toContain(
      "Unexpected transformed owner placeholder",
    );
  });

  it("prepares valid recipe and cookbook documents for import", () => {
    const recipeResult = prepareRecipeDocument(
      {
        _id: "42b43066f0148028c8ee5b36",
        legacyId: 2,
        userId: DEFAULT_ADMIN_PLACEHOLDER,
        legacyOwnerId: null,
        legacyOwnerSource: null,
        name: "Cake",
        ingredients: "Flour",
        instructions: "Bake",
        notes: null,
        servings: 8,
        prepTime: null,
        cookTime: null,
        difficulty: null,
        sourceId: "5f6629c9f91181e165be069b",
        classificationId: null,
        dateAdded: "2002-06-01T00:00:00.000Z",
        calories: null,
        fat: null,
        cholesterol: null,
        sodium: null,
        protein: null,
        imageUrl: null,
        isPublic: true,
        marked: false,
        mealIds: ["dab695a6d16ebb3bf857b2e8"],
        courseIds: [],
        preparationIds: [],
        createdAt: "2002-06-01T04:00:00.000Z",
        updatedAt: null,
      },
      "507f1f77bcf86cd799439011",
      mongoose.Types.ObjectId,
    );
    const cookbookResult = prepareCookbookDocument(
      {
        _id: "f34362e9ae3c4fba5da78b91",
        legacyId: 4,
        userId: DEFAULT_ADMIN_PLACEHOLDER,
        legacyOwnerId: null,
        legacyOwnerSource: null,
        name: "Desserts",
        description: null,
        isPublic: true,
        imageUrl: null,
        recipes: [{ recipeId: "42b43066f0148028c8ee5b36", orderIndex: 0 }],
        createdAt: null,
        updatedAt: null,
      },
      "507f1f77bcf86cd799439011",
      mongoose.Types.ObjectId,
    );

    expect(String(recipeResult.document?._id)).toBe("42b43066f0148028c8ee5b36");
    expect(String(recipeResult.document?.userId)).toBe(
      "507f1f77bcf86cd799439011",
    );
    expect(recipeResult.document?.dateAdded).toEqual(
      new Date("2002-06-01T00:00:00.000Z"),
    );
    expect(String(cookbookResult.document?.recipes[0].recipeId)).toBe(
      "42b43066f0148028c8ee5b36",
    );
  });
});
