// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Notification } from "@/db/models";

function makeIds() {
  return {
    userId: new Types.ObjectId(),
    senderId: new Types.ObjectId(),
    cookbookId: new Types.ObjectId(),
    recipeId: new Types.ObjectId(),
  };
}

describe("Notification model — schema validation", () => {
  it("saves a valid notification with type 'collaboration_invited'", async () => {
    await withCleanDb(async () => {
      const { userId, senderId, cookbookId } = makeIds();
      const doc = await new Notification({
        userId,
        senderId,
        type: "collaboration_invited",
        data: {
          cookbookId,
          cookbookTitle: "My Awesome Cookbook",
        },
      }).save();
      expect(doc.type).toBe("collaboration_invited");
      expect(doc.read).toBe(false);
      expect(doc.createdAt).toBeInstanceOf(Date);
    });
  });

  it("saves a valid notification with type 'recipe_added'", async () => {
    await withCleanDb(async () => {
      const { userId, senderId, cookbookId, recipeId } = makeIds();
      const doc = await new Notification({
        userId,
        senderId,
        type: "recipe_added",
        data: {
          cookbookId,
          cookbookTitle: "My Awesome Cookbook",
          recipeId,
          recipeTitle: "Spaghetti Carbonara",
        },
      }).save();
      expect(doc.type).toBe("recipe_added");
    });
  });

  it("rejects an invalid type value", async () => {
    await withCleanDb(async () => {
      const { userId, senderId } = makeIds();
      const doc = new Notification({
        userId,
        senderId,
        type: "invalid_type",
      });
      await expect(doc.save()).rejects.toThrow();
    });
  });

  it("requires userId", async () => {
    await withCleanDb(async () => {
      const { senderId } = makeIds();
      const doc = new Notification({
        senderId,
        type: "collaboration_invited",
      });
      await expect(doc.save()).rejects.toThrow();
    });
  });

  it("requires senderId", async () => {
    await withCleanDb(async () => {
      const { userId } = makeIds();
      const doc = new Notification({
        userId,
        type: "collaboration_invited",
      });
      await expect(doc.save()).rejects.toThrow();
    });
  });

  it("requires type", async () => {
    await withCleanDb(async () => {
      const { userId, senderId } = makeIds();
      const doc = new Notification({
        userId,
        senderId,
      });
      await expect(doc.save()).rejects.toThrow();
    });
  });

  it("sets read to false by default", async () => {
    await withCleanDb(async () => {
      const { userId, senderId } = makeIds();
      const doc = await new Notification({
        userId,
        senderId,
        type: "collaboration_removed",
      }).save();
      expect(doc.read).toBe(false);
    });
  });
});
