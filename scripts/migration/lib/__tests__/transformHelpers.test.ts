import { describe, expect, it } from "vitest";

import {
  groupCookbookRecipes,
  groupPivotIds,
  normalizeNumber,
  normalizeText,
  normalizeTimestamp,
  resolveLegacyReference,
  slugify,
} from "../transformHelpers";

describe("transform helpers", () => {
  it("normalizes timestamps and text values", () => {
    expect(normalizeTimestamp("2002-06-01 04:00:00")).toBe(
      "2002-06-01T04:00:00.000Z",
    );
    expect(normalizeTimestamp("0000-00-00 00:00:00")).toBeNull();
    expect(normalizeText("line1\r\nline2")).toBe("line1\nline2");
  });

  it("groups pivot rows into embedded relationships", () => {
    const groupedMeals = groupPivotIds(
      [
        { id: 1, recipe_id: 10, meal_id: 5 },
        { id: 2, recipe_id: 10, meal_id: 6 },
        { id: 3, recipe_id: 11, meal_id: 7 },
      ],
      "recipe_id",
      "meal_id",
      { 5: "meal-a", 6: "meal-b", 7: "meal-c" },
    );
    const groupedCookbooks = groupCookbookRecipes(
      [
        { id: 1, cookbook_id: 3, recipe_id: 10 },
        { id: 2, cookbook_id: 3, recipe_id: 11 },
      ],
      { 10: "recipe-a", 11: "recipe-b" },
    );

    expect(groupedMeals.get(10)).toEqual(["meal-a", "meal-b"]);
    expect(groupedMeals.get(11)).toEqual(["meal-c"]);
    expect(groupedCookbooks.get(3)).toEqual([
      { recipeId: "recipe-a", orderIndex: 0 },
      { recipeId: "recipe-b", orderIndex: 1 },
    ]);
  });

  it("normalizes numeric and lookup fields", () => {
    expect(normalizeNumber("12.5")).toBe(12.5);
    expect(normalizeNumber("not-a-number")).toBeNull();
    expect(resolveLegacyReference(0, { 1: "a" })).toBeNull();
    expect(resolveLegacyReference(1, { 1: "a" })).toBe("a");
    expect(slugify(" Cakes, Cupcakes & Cheesecakes ")).toBe(
      "cakes-cupcakes-cheesecakes",
    );
  });
});
