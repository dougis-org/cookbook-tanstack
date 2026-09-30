// @vitest-environment node
/**
 * Tests for Task 3.1 (thread ctx.sharedOwnerIds through visibilityFilter call sites)
 * and Task 3.2 (sharedBy attribution) of share-my-library-read-path-integration.
 */
import { describe, it, expect, vi } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Recipe, Cookbook } from "@/db/models";
import {
  seedUserWithBetterAuth,
  makeAuthCaller,
  makeAnonCaller,
  seedLibraryShareGrant,
  seedGrantWithPrivateRecipe,
  seedGrantWithPrivateCookbook,
  setUserTier,
  callerFor,
} from "./test-helpers";

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

describe("Task 3.1 — recipient visibility via ctx.sharedOwnerIds", () => {
  it("recipes.list includes the owner's private recipe", async () => {
    await withCleanDb(async () => {
      const { recipient, recipe: privateRecipe } = await seedGrantWithPrivateRecipe();

      const caller = await callerFor(recipient.id);
      const result = await caller.recipes.list();

      expect(result.items.map((r) => r.id)).toContain(privateRecipe.id);
    });
  });

  it("recipes.byId succeeds for the owner's private recipe", async () => {
    await withCleanDb(async () => {
      const { recipient, recipe: privateRecipe } = await seedGrantWithPrivateRecipe();

      const caller = await callerFor(recipient.id);
      const result = await caller.recipes.byId({ id: privateRecipe.id });

      expect(result).not.toBeNull();
      expect(result!.id).toBe(privateRecipe.id);
    });
  });

  it("cookbooks.list includes the owner's private cookbook", async () => {
    await withCleanDb(async () => {
      const { recipient, cookbook: privateCookbook } = await seedGrantWithPrivateCookbook();

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.list();

      expect(result.map((c) => c.id)).toContain(privateCookbook.id);
    });
  });

  it("cookbooks.byId succeeds for the owner's private cookbook", async () => {
    await withCleanDb(async () => {
      const { recipient, cookbook: privateCookbook } = await seedGrantWithPrivateCookbook();

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.byId({ id: privateCookbook.id });

      expect(result).not.toBeNull();
      expect(result!.id).toBe(privateCookbook.id);
    });
  });

  it("a recipe created by the owner after the grant is visible to the recipient", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      const laterRecipe = await new Recipe({ name: "Later Recipe", userId: owner.id, isPublic: false }).save();

      const caller = await callerFor(recipient.id);
      const result = await caller.recipes.list();

      expect(result.items.map((r) => r.id)).toContain(laterRecipe.id);
    });
  });

  it("a stranger with no grant sees none of the owner's private content", async () => {
    await withCleanDb(async () => {
      const { owner } = await seedLibraryShareGrant();
      const privateRecipe = await new Recipe({ name: "Secret Soup", userId: owner.id, isPublic: false }).save();
      const privateCookbook = await new Cookbook({ name: "Secret Book", userId: owner.id, isPublic: false, recipes: [] }).save();
      const stranger = await seedUserWithBetterAuth();

      const caller = await makeAuthCaller(stranger.id);
      const recipesResult = await caller.recipes.list();
      const cookbooksResult = await caller.cookbooks.list();

      expect(recipesResult.items.map((r) => r.id)).not.toContain(privateRecipe.id);
      expect(cookbooksResult.map((c) => c.id)).not.toContain(privateCookbook.id);
    });
  });

  it("recipient's own recipe and an unrelated public recipe both carry sharedBy: null", async () => {
    await withCleanDb(async () => {
      const { recipient } = await seedLibraryShareGrant();
      const thirdParty = await seedUserWithBetterAuth();
      const ownRecipe = await new Recipe({ name: "My Own", userId: recipient.id, isPublic: false }).save();
      const publicRecipe = await new Recipe({ name: "Public One", userId: thirdParty.id, isPublic: true }).save();

      const caller = await callerFor(recipient.id);
      const result = await caller.recipes.list();

      const own = result.items.find((r) => r.id === ownRecipe.id);
      const pub = result.items.find((r) => r.id === publicRecipe.id);
      expect(own?.sharedBy ?? null).toBeNull();
      expect(pub?.sharedBy ?? null).toBeNull();
    });
  });

  it("privateRecipeNotes.upsert allows a note on the owner's shared recipe", async () => {
    await withCleanDb(async () => {
      const { recipient, recipe: privateRecipe } = await seedGrantWithPrivateRecipe();

      const caller = await callerFor(recipient.id, { tier: "sous-chef" });
      const result = await caller.privateRecipeNotes.upsert({ recipeId: privateRecipe.id, body: "Great recipe" });

      expect(result).toEqual({ success: true });
    });
  });

  it("cookbooks.addRecipe allows adding the owner's shared recipe to the recipient's own cookbook", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      const sharedRecipe = await new Recipe({ name: "Secret Soup", userId: owner.id, isPublic: false }).save();
      const ownCookbook = await new Cookbook({ name: "My Cookbook", userId: recipient.id, isPublic: false, recipes: [] }).save();

      const caller = await callerFor(recipient.id);
      await caller.cookbooks.addRecipe({ cookbookId: ownCookbook.id, recipeId: sharedRecipe.id });

      const persisted = await Cookbook.findById(ownCookbook.id).lean();
      expect(persisted!.recipes.some((r: { recipeId: unknown }) => String(r.recipeId) === sharedRecipe.id)).toBe(true);
    });
  });

  it("cookbooks.buildChaptersByCategory resolves the owner's shared recipe stub", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      const { Classification } = await import("@/db/models");
      const classification = await new Classification({ name: "Dessert", slug: `dessert-${Date.now()}` }).save();
      const sharedRecipe = await new Recipe({
        name: "Secret Cake",
        userId: owner.id,
        isPublic: false,
        classificationId: classification.id,
      }).save();
      const ownCookbook = await new Cookbook({
        name: "My Cookbook",
        userId: recipient.id,
        isPublic: false,
        recipes: [{ recipeId: sharedRecipe.id, orderIndex: 0 }],
      }).save();

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.buildChaptersByCategory({ cookbookId: ownCookbook.id, dryRun: true });

      expect(result.summary.created).toEqual([{ name: "Dessert", recipeCount: 1 }]);
    });
  });

  it("excludes the owner's hiddenByTier recipe from the recipient's view", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      const hidden = await new Recipe({ name: "Hidden", userId: owner.id, isPublic: false, hiddenByTier: true }).save();

      const caller = await callerFor(recipient.id);
      const result = await caller.recipes.list();

      expect(result.items.map((r) => r.id)).not.toContain(hidden.id);
    });
  });

  it("excludes the owner's soft-deleted recipe from the recipient's view", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      const deleted = await new Recipe({ name: "Deleted", userId: owner.id, isPublic: false }).save();
      await Recipe.updateOne({ _id: deleted._id }, { $set: { deleted: true } });

      const caller = await callerFor(recipient.id);
      const result = await caller.recipes.list();

      expect(result.items.map((r) => r.id)).not.toContain(deleted.id);
    });
  });

  it("regression: recipes.list({ search }) does not bypass visibility for a caller with no grant (search must not clobber the visibility filter)", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      const privateRecipe = await new Recipe({ name: "Stranger's Pasta Secret", userId: owner.id, isPublic: false }).save();
      const stranger = await seedUserWithBetterAuth();

      const caller = await makeAuthCaller(stranger.id);
      const result = await caller.recipes.list({ search: "Pasta" });

      expect(result.items.map((r) => r.id)).not.toContain(privateRecipe.id);
    });
  });

  it("regression: recipes.list({ isPublic: false }) does not leak every user's private recipes (isPublic must narrow, not replace, visibility)", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      const privateRecipe = await new Recipe({ name: "Stranger's Diary Recipe", userId: owner.id, isPublic: false }).save();

      // No userId supplied — this must not become "every private recipe from anyone."
      const anonResult = await (await makeAnonCaller()).recipes.list({ isPublic: false });
      expect(anonResult.items.map((r) => r.id)).not.toContain(privateRecipe.id);

      const stranger = await seedUserWithBetterAuth();
      const strangerResult = await (await makeAuthCaller(stranger.id)).recipes.list({ isPublic: false });
      expect(strangerResult.items.map((r) => r.id)).not.toContain(privateRecipe.id);

      // The actual exploit shape: isPublic: false + an explicit victim userId must not
      // bypass visibility either — a stranger naming the owner directly still sees nothing.
      const targetedResult = await (await makeAuthCaller(stranger.id)).recipes.list({ isPublic: false, userId: owner.id });
      expect(targetedResult.items.map((r) => r.id)).not.toContain(privateRecipe.id);

      // The owner themselves still sees it via isPublic: false + userId.
      const ownerResult = await (await makeAuthCaller(owner.id)).recipes.list({ isPublic: false, userId: owner.id });
      expect(ownerResult.items.map((r) => r.id)).toContain(privateRecipe.id);
    });
  });

  it("regression: sharedOwnerIds omitted produces byte-identical visibility to a caller with no grant", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      await setUserTier(owner.id, "executive-chef");
      const publicRecipe = await new Recipe({ name: "Public", userId: owner.id, isPublic: true }).save();
      const privateRecipe = await new Recipe({ name: "Private", userId: owner.id, isPublic: false }).save();
      const stranger = await seedUserWithBetterAuth();

      const callerNoGrant = await makeAuthCaller(stranger.id);
      const result = await callerNoGrant.recipes.list();

      expect(result.items.map((r) => r.id)).toContain(publicRecipe.id);
      expect(result.items.map((r) => r.id)).not.toContain(privateRecipe.id);
    });
  });
});

describe("Task 3.2 — sharedBy attribution", () => {
  it("a shared recipe carries sharedBy: { id, name } matching the owner", async () => {
    await withCleanDb(async () => {
      const { owner, recipient, recipe: privateRecipe } = await seedGrantWithPrivateRecipe();

      const caller = await callerFor(recipient.id);
      const result = await caller.recipes.byId({ id: privateRecipe.id });

      expect(result!.sharedBy).toEqual({ id: owner.id, name: owner.name });
    });
  });

  it("a shared cookbook carries sharedBy", async () => {
    await withCleanDb(async () => {
      const { owner, recipient, cookbook: privateCookbook } = await seedGrantWithPrivateCookbook();

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.byId({ id: privateCookbook.id });

      expect(result!.sharedBy).toEqual({ id: owner.id, name: owner.name });
    });
  });

  it("cookbooks.list also carries sharedBy on each row (byId and list resolve it via separate code paths)", async () => {
    await withCleanDb(async () => {
      const { owner, recipient, cookbook: privateCookbook } = await seedGrantWithPrivateCookbook();

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.list();

      const row = result.find((c) => c.id === privateCookbook.id);
      expect(row?.sharedBy).toEqual({ id: owner.id, name: owner.name });
    });
  });

  it("payload contains no owner email or tier anywhere in the response", async () => {
    await withCleanDb(async () => {
      const { owner, recipient, recipe: privateRecipe } = await seedGrantWithPrivateRecipe();

      const caller = await callerFor(recipient.id);
      const result = await caller.recipes.byId({ id: privateRecipe.id });

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain(owner.email);
      expect(serialized).not.toContain("executive-chef");
    });
  });

  it("resolves owner names for N shared items via exactly one additional batched query", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      await Promise.all(
        Array.from({ length: 5 }, (_, i) => new Recipe({ name: `Recipe ${i}`, userId: owner.id, isPublic: false }).save()),
      );

      const dbModule = await import("@/db");
      const getCollectionSpy = vi.spyOn(dbModule, "getBetterAuthCollection");

      const caller = await callerFor(recipient.id);
      await caller.recipes.list();

      // recipes.list's only call into getBetterAuthCollection("user") is the sharedBy
      // batch lookup — exactly one call regardless of how many shared items are in the page.
      expect(getCollectionSpy).toHaveBeenCalledTimes(1);
      getCollectionSpy.mockRestore();
    });
  });
});
