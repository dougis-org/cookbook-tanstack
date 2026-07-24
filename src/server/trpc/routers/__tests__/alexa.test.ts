// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Recipe, Cookbook } from "@/db/models";
import { seedUserWithBetterAuth } from "./test-helpers";

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

const { validateAlexaAccessToken } = vi.hoisted(() => ({ validateAlexaAccessToken: vi.fn() }));
vi.mock("@/server/alexa/token-validation", () => ({
  validateAlexaAccessToken,
  ALEXA_READ_SCOPE: "read:own-content",
}));

async function getCaller() {
  const { appRouter } = await import("@/server/trpc/router");
  return appRouter.createCaller({ session: null, user: null, collabCookbookIds: [] });
}

beforeEach(() => {
  validateAlexaAccessToken.mockReset();
});

describe("alexa.searchRecipes", () => {
  it("returns only public recipes for an unauthenticated request", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      await new Recipe({ name: "Chicken Tikka Masala", userId: owner.id, isPublic: true }).save();
      await new Recipe({ name: "Secret Family Recipe", userId: owner.id, isPublic: false }).save();

      const caller = await getCaller();
      const result = await caller.alexa.searchRecipes({ query: "recipe" });

      expect(result.items.every((i) => i.name !== "Secret Family Recipe")).toBe(true);
    });
  });

  it("respects the search term against name/ingredients", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      await new Recipe({ name: "Chicken Tikka Masala", userId: owner.id, isPublic: true }).save();
      await new Recipe({ name: "Beef Stew", userId: owner.id, isPublic: true }).save();

      const caller = await getCaller();
      const result = await caller.alexa.searchRecipes({ query: "tikka" });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ name: "Chicken Tikka Masala" });
    });
  });

  it("returns an empty result set without erroring when there are no matches", async () => {
    await withCleanDb(async () => {
      const caller = await getCaller();
      const result = await caller.alexa.searchRecipes({ query: "nonexistent-xyz" });
      expect(result.items).toEqual([]);
    });
  });
});

describe("alexa.recipeDetail", () => {
  it("returns a voice/APL-shaped response with flattened ingredients and numbered steps", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      const recipe = await new Recipe({
        name: "Pancakes",
        userId: owner.id,
        isPublic: true,
        ingredients: "Flour\nEggs\nMilk",
        instructions: "Mix ingredients.\nCook on griddle.",
        notes: "Best served hot.",
      }).save();

      const caller = await getCaller();
      const result = await caller.alexa.recipeDetail({ id: recipe.id.toString() });

      expect(result).toMatchObject({
        name: "Pancakes",
        ingredients: ["Flour", "Eggs", "Milk"],
        steps: ["Mix ingredients.", "Cook on griddle."],
      });
    });
  });

  it("never includes note content in the response, for any tier", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      const recipe = await new Recipe({
        name: "Pancakes",
        userId: owner.id,
        isPublic: true,
        notes: "This must never be spoken aloud.",
      }).save();

      const caller = await getCaller();
      const result = await caller.alexa.recipeDetail({ id: recipe.id.toString() });

      expect(JSON.stringify(result)).not.toContain("never be spoken");
    });
  });
});

describe("alexa.myRecipes", () => {
  it("returns only the caller's own recipes for a valid access token", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      const other = await seedUserWithBetterAuth();
      await new Recipe({ name: "Owner's Private Recipe", userId: owner.id, isPublic: false }).save();
      await new Recipe({ name: "Other's Private Recipe", userId: other.id, isPublic: false }).save();
      validateAlexaAccessToken.mockResolvedValue({ userId: owner.id });

      const caller = await getCaller();
      const result = await caller.alexa.myRecipes({ token: "valid-token" });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ name: "Owner's Private Recipe" });
    });
  });

  it("rejects a request with a missing access token", async () => {
    await withCleanDb(async () => {
      validateAlexaAccessToken.mockResolvedValue(null);
      const caller = await getCaller();
      await expect(caller.alexa.myRecipes({ token: "" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  it("rejects a request with an expired or revoked access token", async () => {
    await withCleanDb(async () => {
      validateAlexaAccessToken.mockResolvedValue(null);
      const caller = await getCaller();
      await expect(caller.alexa.myRecipes({ token: "expired-token" })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });
  });

  it("hides recipes over the tier limit the same way the web app does", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      await new Recipe({ name: "Visible", userId: owner.id, isPublic: false, hiddenByTier: false }).save();
      await new Recipe({ name: "Hidden By Tier", userId: owner.id, isPublic: false, hiddenByTier: true }).save();
      validateAlexaAccessToken.mockResolvedValue({ userId: owner.id });

      const caller = await getCaller();
      const result = await caller.alexa.myRecipes({ token: "valid-token" });

      expect(result.items.map((i) => i.name)).toEqual(["Visible"]);
    });
  });
});

describe("alexa.cookbookDetail", () => {
  it("returns chapters/entries for an owned, resolvable cookbook", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      const cookbook = await new Cookbook({ name: "My Cookbook", userId: owner.id, isPublic: false }).save();
      validateAlexaAccessToken.mockResolvedValue({ userId: owner.id });

      const caller = await getCaller();
      const result = await caller.alexa.cookbookDetail({ token: "valid-token", id: cookbook.id.toString() });

      expect(result).toMatchObject({ name: "My Cookbook" });
    });
  });

  it("does not reveal a cookbook owned by another user", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      const requester = await seedUserWithBetterAuth();
      const cookbook = await new Cookbook({ name: "Not Yours", userId: owner.id, isPublic: false }).save();
      validateAlexaAccessToken.mockResolvedValue({ userId: requester.id });

      const caller = await getCaller();
      const result = await caller.alexa.cookbookDetail({ token: "valid-token", id: cookbook.id.toString() });

      expect(result).toBeNull();
    });
  });
});

describe("alexa read-only boundary", () => {
  it("exposes no create/update/delete procedure on the adapter surface", async () => {
    const { alexaRouter } = await import("@/server/trpc/routers/alexa");
    const procedureNames = Object.keys(alexaRouter._def.procedures ?? {});
    expect(procedureNames.some((n) => /create|update|delete|mutat/i.test(n))).toBe(false);
  });
});
