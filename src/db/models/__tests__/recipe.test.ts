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
