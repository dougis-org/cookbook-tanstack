// @vitest-environment node
import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Recipe } from "@/db/models";
import { publishPendingRecipes } from "../pendingRecipes";

function makeUserId() {
  return new Types.ObjectId().toHexString();
}

describe("publishPendingRecipes", () => {
  it("T3.1 — publishes all pending recipes for a user", async () => {
    await withCleanDb(async () => {
      const userId = makeUserId();
      await new Recipe({ name: "R1", userId, isPublic: true, pendingVerification: true }).save();
      await new Recipe({ name: "R2", userId, isPublic: true, pendingVerification: true }).save();

      await publishPendingRecipes(userId);

      const updated = await Recipe.find({ userId }).lean();
      for (const r of updated) {
        expect(r.pendingVerification).not.toBe(true);
      }
    });
  });

  it("T3.2 — no-op when user has no pending recipes", async () => {
    await withCleanDb(async () => {
      const userId = makeUserId();
      await new Recipe({ name: "Published", userId, isPublic: true }).save();

      // Should not throw
      await expect(publishPendingRecipes(userId)).resolves.toBeUndefined();

      const docs = await Recipe.find({ userId }).lean();
      expect(docs).toHaveLength(1);
      expect(docs[0].pendingVerification).not.toBe(true);
    });
  });

  it("T3.3 — idempotent: calling twice is safe", async () => {
    await withCleanDb(async () => {
      const userId = makeUserId();
      await new Recipe({ name: "R1", userId, isPublic: true, pendingVerification: true }).save();

      await publishPendingRecipes(userId);
      // Second call should not throw
      await expect(publishPendingRecipes(userId)).resolves.toBeUndefined();

      const docs = await Recipe.find({ userId }).lean();
      expect(docs[0].pendingVerification).not.toBe(true);
    });
  });

  it("T3.4 — does not publish other users' pending recipes", async () => {
    await withCleanDb(async () => {
      const userA = makeUserId();
      const userB = makeUserId();
      await new Recipe({ name: "A Pending", userId: userA, isPublic: true, pendingVerification: true }).save();
      await new Recipe({ name: "B Pending", userId: userB, isPublic: true, pendingVerification: true }).save();

      await publishPendingRecipes(userA);

      const aRecipes = await Recipe.find({ userId: userA }).lean();
      const bRecipes = await Recipe.find({ userId: userB }).lean();
      expect(aRecipes[0].pendingVerification).not.toBe(true);
      expect(bRecipes[0].pendingVerification).toBe(true);
    });
  });
});
