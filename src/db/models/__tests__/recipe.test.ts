// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Recipe } from "@/db/models";

function makeUserId() {
  return new Types.ObjectId();
}

describe("Recipe model — pendingVerification field", () => {
  it("T1.1 — recipe without pendingVerification defaults to absent/false (no breakage)", async () => {
    await withCleanDb(async () => {
      const userId = makeUserId();
      const doc = await new Recipe({ name: "Test Recipe", userId, isPublic: true }).save();
      // pendingVerification is absent or false — either is acceptable; must not be true
      expect(doc.pendingVerification).not.toBe(true);
    });
  });

  it("T1.2 — pendingVerification: true is stored and retrievable", async () => {
    await withCleanDb(async () => {
      const userId = makeUserId();
      const doc = await new Recipe({
        name: "Pending Recipe",
        userId,
        isPublic: true,
        pendingVerification: true,
      }).save();

      const fetched = await Recipe.findById(doc._id).lean();
      expect(fetched?.pendingVerification).toBe(true);
    });
  });
});

describe("Recipe model — personalSourceName field", () => {
  it("T2.1 — personalSourceName > 80 chars throws validation error", async () => {
    await withCleanDb(async () => {
      const userId = makeUserId();
      const longName = "a".repeat(81);
      
      const recipe = new Recipe({
        name: "Test Recipe",
        userId,
        isPublic: true,
        personalSourceName: longName,
      });

      await expect(recipe.save()).rejects.toThrow(/validation failed/i);
    });
  });

  it("T2.2 — empty string or undefined saves and round-trips correctly", async () => {
    await withCleanDb(async () => {
      const userId = makeUserId();
      
      // Undefined
      const doc1 = await new Recipe({
        name: "Recipe 1",
        userId,
        isPublic: true,
      }).save();
      expect(doc1.personalSourceName).toBeUndefined();

      // Empty string
      const doc2 = await new Recipe({
        name: "Recipe 2",
        userId,
        isPublic: true,
        personalSourceName: "",
      }).save();
      expect(doc2.personalSourceName).toBe("");

      // Round-trip
      const fetched1 = await Recipe.findById(doc1._id).lean();
      expect(fetched1?.personalSourceName).toBeUndefined();

      const fetched2 = await Recipe.findById(doc2._id).lean();
      expect(fetched2?.personalSourceName).toBe("");
    });
  });
});
