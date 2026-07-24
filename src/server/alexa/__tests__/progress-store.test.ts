// @vitest-environment node
import { describe, it, expect } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { getProgress, saveProgress, clearProgress } from "../progress-store";

describe("progress store", () => {
  it("returns null when there is no persisted progress for an Alexa user", async () => {
    await withCleanDb(async () => {
      const result = await getProgress("amzn1.ask.account.NO_PROGRESS");
      expect(result).toBeNull();
    });
  });

  it("reads and updates a persisted { recipeId, stepIndex } record keyed by Alexa userId", async () => {
    await withCleanDb(async () => {
      const userId = "amzn1.ask.account.ABC";
      await saveProgress(userId, { recipeId: "recipe-1", stepIndex: 2 });

      expect(await getProgress(userId)).toEqual({ recipeId: "recipe-1", stepIndex: 2 });

      await saveProgress(userId, { recipeId: "recipe-1", stepIndex: 3 });
      expect(await getProgress(userId)).toEqual({ recipeId: "recipe-1", stepIndex: 3 });
    });
  });

  it("scopes progress independently per Alexa userId", async () => {
    await withCleanDb(async () => {
      await saveProgress("user-a", { recipeId: "recipe-a", stepIndex: 1 });
      await saveProgress("user-b", { recipeId: "recipe-b", stepIndex: 5 });

      expect(await getProgress("user-a")).toEqual({ recipeId: "recipe-a", stepIndex: 1 });
      expect(await getProgress("user-b")).toEqual({ recipeId: "recipe-b", stepIndex: 5 });
    });
  });

  it("clears persisted progress", async () => {
    await withCleanDb(async () => {
      const userId = "amzn1.ask.account.CLEAR";
      await saveProgress(userId, { recipeId: "recipe-1", stepIndex: 0 });
      await clearProgress(userId);
      expect(await getProgress(userId)).toBeNull();
    });
  });
});
