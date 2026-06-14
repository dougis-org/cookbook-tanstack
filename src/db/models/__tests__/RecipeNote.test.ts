// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { RecipeNote } from "@/db/models";

function makeIds() {
  return {
    userId: new Types.ObjectId(),
    recipeId: new Types.ObjectId(),
  };
}

describe("RecipeNote model — schema validation", () => {
  it("saves a valid note", async () => {
    await withCleanDb(async () => {
      const { userId, recipeId } = makeIds();
      const doc = await new RecipeNote({ userId, recipeId, body: "Great recipe!" }).save();
      expect(doc.userId.toString()).toBe(userId.toString());
      expect(doc.recipeId.toString()).toBe(recipeId.toString());
      expect(doc.body).toBe("Great recipe!");
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);
    });
  });

  it("requires userId", async () => {
    await withCleanDb(async () => {
      const { recipeId } = makeIds();
      const doc = new RecipeNote({ recipeId, body: "test" });
      await expect(doc.save()).rejects.toThrow(/userId/);
    });
  });

  it("requires recipeId", async () => {
    await withCleanDb(async () => {
      const { userId } = makeIds();
      const doc = new RecipeNote({ userId, body: "test" });
      await expect(doc.save()).rejects.toThrow(/recipeId/);
    });
  });

  it("requires body", async () => {
    await withCleanDb(async () => {
      const { userId, recipeId } = makeIds();
      const doc = new RecipeNote({ userId, recipeId });
      await expect(doc.save()).rejects.toThrow(/body/);
    });
  });

  it("rejects body exceeding 10000 characters", async () => {
    await withCleanDb(async () => {
      const { userId, recipeId } = makeIds();
      const doc = new RecipeNote({ userId, recipeId, body: "x".repeat(10001) });
      await expect(doc.save()).rejects.toMatchObject({
        errors: { body: { kind: "maxlength" } },
      });
    });
  });

  it("trims whitespace from body", async () => {
    await withCleanDb(async () => {
      const { userId, recipeId } = makeIds();
      const doc = await new RecipeNote({ userId, recipeId, body: "  hello  " }).save();
      expect(doc.body).toBe("hello");
    });
  });

  it("populates createdAt and updatedAt as Date instances", async () => {
    await withCleanDb(async () => {
      const { userId, recipeId } = makeIds();
      const doc = await new RecipeNote({ userId, recipeId, body: "note" }).save();
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);
    });
  });

  it("rejects duplicate (userId, recipeId) pair", async () => {
    await withCleanDb(async () => {
      await RecipeNote.init();
      const { userId, recipeId } = makeIds();
      await new RecipeNote({ userId, recipeId, body: "first" }).save();
      const dup = new RecipeNote({ userId, recipeId, body: "second" });
      const err = await dup.save().catch((e: unknown) => e);
      expect((err as { code?: number }).code).toBe(11000);
    });
  });

  it("allows same userId with different recipeId", async () => {
    await withCleanDb(async () => {
      const userId = new Types.ObjectId();
      const recipeId1 = new Types.ObjectId();
      const recipeId2 = new Types.ObjectId();
      await new RecipeNote({ userId, recipeId: recipeId1, body: "note 1" }).save();
      const doc2 = await new RecipeNote({ userId, recipeId: recipeId2, body: "note 2" }).save();
      expect(doc2.body).toBe("note 2");
    });
  });
});
