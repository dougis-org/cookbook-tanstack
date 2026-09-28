// @vitest-environment node
/**
 * Tests for Task 3.3 (cross-owner cookbook entries) of
 * share-my-library-read-path-integration: adding a shared recipe to an owned
 * cookbook, live-reference resolution, and graceful degradation to
 * `{ recipeId, unavailable: true }` when access to the referenced recipe ends.
 */
import { describe, it, expect, vi } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Recipe, Cookbook, Collaborator } from "@/db/models";
import {
  seedUserWithBetterAuth,
  makeAuthCaller,
  seedLibraryShareGrant,
  resolveSharedOwnerIds,
  setUserTier,
} from "./test-helpers";

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

async function callerFor(recipientId: string) {
  const sharedOwnerIds = await resolveSharedOwnerIds(recipientId);
  return makeAuthCaller(recipientId, { sharedOwnerIds });
}

/**
 * Seeds a grant, a private recipe owned by the grantor, and the recipient's own
 * cookbook already containing that recipe as a cross-owner entry — the setup shared
 * by most of the "degrades to unavailable" tests below.
 */
async function seedGrantWithCookbookEntry(recipeFields: Record<string, unknown> = {}) {
  const { owner, recipient, grant } = await seedLibraryShareGrant();
  const sharedRecipe = await new Recipe({ name: "Owner's Soup", userId: owner.id, isPublic: false, ...recipeFields }).save();
  const ownCookbook = await new Cookbook({
    name: "My Cookbook", userId: recipient.id, isPublic: false,
    recipes: [{ recipeId: sharedRecipe.id, orderIndex: 0 }],
  }).save();
  return { owner, recipient, grant, sharedRecipe, ownCookbook };
}

describe("Task 3.3 — adding shared recipes to own cookbooks", () => {
  it("adds the owner's shared recipe to the recipient's cookbook without creating a new Recipe document or touching quota", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      const sharedRecipe = await new Recipe({ name: "Owner's Soup", userId: owner.id, isPublic: false }).save();
      const ownCookbook = await new Cookbook({ name: "My Cookbook", userId: recipient.id, isPublic: false, recipes: [] }).save();

      const recipeCountBefore = await Recipe.countDocuments({ userId: recipient.id });
      const caller = await callerFor(recipient.id);
      await caller.cookbooks.addRecipe({ cookbookId: ownCookbook.id, recipeId: sharedRecipe.id });
      const recipeCountAfter = await Recipe.countDocuments({ userId: recipient.id });

      expect(recipeCountAfter).toBe(recipeCountBefore);
      const persisted = await Cookbook.findById(ownCookbook.id).lean();
      expect(persisted!.recipes).toHaveLength(1);
      expect(String(persisted!.recipes[0].recipeId)).toBe(sharedRecipe.id);
    });
  });

  it("resolves the cross-owner entry via cookbooks.byId with sharedBy populated", async () => {
    await withCleanDb(async () => {
      const { owner, recipient, sharedRecipe, ownCookbook } = await seedGrantWithCookbookEntry();

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.byId({ id: ownCookbook.id });

      const entry = result!.recipes[0] as { id: string; sharedBy: { id: string; name: string } | null };
      expect(entry.id).toBe(sharedRecipe.id);
      expect(entry.sharedBy).toEqual({ id: owner.id, name: owner.name });
    });
  });

  it("reflects the owner's later edits (live reference, not a copy)", async () => {
    await withCleanDb(async () => {
      const { recipient, sharedRecipe, ownCookbook } = await seedGrantWithCookbookEntry({ servings: 2 });

      await Recipe.updateOne({ _id: sharedRecipe._id }, { $set: { servings: 8 } });

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.byId({ id: ownCookbook.id });
      const entry = result!.recipes[0] as { servings: number };

      expect(entry.servings).toBe(8);
    });
  });

  it("rejects adding a recipe the recipient cannot see", async () => {
    await withCleanDb(async () => {
      const { recipient } = await seedLibraryShareGrant();
      const unrelatedOwner = await seedUserWithBetterAuth();
      const invisibleRecipe = await new Recipe({ name: "Not Yours", userId: unrelatedOwner.id, isPublic: false }).save();
      const ownCookbook = await new Cookbook({ name: "My Cookbook", userId: recipient.id, isPublic: false, recipes: [] }).save();

      const caller = await callerFor(recipient.id);
      await expect(
        caller.cookbooks.addRecipe({ cookbookId: ownCookbook.id, recipeId: invisibleRecipe.id }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      const persisted = await Cookbook.findById(ownCookbook.id).lean();
      expect(persisted!.recipes).toHaveLength(0);
    });
  });

  it("degrades to unavailable: true after the grant is revoked, preserving orderIndex/chapterId and leaking no content", async () => {
    await withCleanDb(async () => {
      const { owner, recipient, grant } = await seedLibraryShareGrant();
      const sharedRecipe = await new Recipe({ name: "Owner's Soup", userId: owner.id, isPublic: false }).save();
      const ownCookbook = await new Cookbook({
        name: "My Cookbook", userId: recipient.id, isPublic: false,
        recipes: [{ recipeId: sharedRecipe.id, orderIndex: 3 }],
      }).save();

      const { LibraryShare } = await import("@/db/models");
      await LibraryShare.deleteOne({ _id: grant._id });

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.byId({ id: ownCookbook.id });
      const entry = result!.recipes[0];

      expect(entry).toEqual({ recipeId: sharedRecipe.id, unavailable: true, orderIndex: 3, chapterId: null });
      expect(JSON.stringify(entry)).not.toContain("Owner's Soup");
    });
  });

  it("degrades to unavailable: true after the owner's tier drops below executive-chef", async () => {
    await withCleanDb(async () => {
      const { owner, recipient, ownCookbook } = await seedGrantWithCookbookEntry();

      await setUserTier(owner.id, "sous-chef");

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.byId({ id: ownCookbook.id });

      expect(result!.recipes[0]).toMatchObject({ unavailable: true });
    });
  });

  it("degrades to unavailable: true after the owner soft-deletes the recipe (grant still active)", async () => {
    await withCleanDb(async () => {
      const { recipient, sharedRecipe, ownCookbook } = await seedGrantWithCookbookEntry();

      await Recipe.updateOne({ _id: sharedRecipe._id }, { $set: { deleted: true } });

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.byId({ id: ownCookbook.id });

      expect(result!.recipes[0]).toMatchObject({ unavailable: true });
    });
  });

  it("a stranger viewing a public cookbook does not see an unavailable stub for a private cross-owner entry (no id/existence leak)", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      const sharedRecipe = await new Recipe({ name: "Owner's Soup", userId: owner.id, isPublic: false }).save();
      const publicCookbook = await new Cookbook({
        name: "Recipient's Public Cookbook", userId: recipient.id, isPublic: true,
        recipes: [{ recipeId: sharedRecipe.id, orderIndex: 0 }],
      }).save();

      // Recipient (owns the cookbook) sees the unavailable-capable entry...
      const recipientCaller = await callerFor(recipient.id);
      const recipientView = await recipientCaller.cookbooks.byId({ id: publicCookbook.id });
      expect(recipientView!.recipes).toHaveLength(1);

      // ...but a stranger with no grant and no relationship to this cookbook must not
      // see any trace of the entry — not the resolved recipe, not an unavailable stub.
      const stranger = await seedUserWithBetterAuth();
      const strangerCaller = await makeAuthCaller(stranger.id);
      const strangerView = await strangerCaller.cookbooks.byId({ id: publicCookbook.id });
      expect(strangerView!.recipes).toHaveLength(0);
      expect(JSON.stringify(strangerView)).not.toContain(sharedRecipe.id);

      // Same for an anonymous caller.
      const { appRouter } = await import("@/server/trpc/router");
      const anonCaller = appRouter.createCaller({ session: null, user: null, getCollabCookbookIds: () => Promise.resolve([]), sharedOwnerIds: [] });
      const anonView = await anonCaller.cookbooks.byId({ id: publicCookbook.id });
      expect(anonView!.recipes).toHaveLength(0);
    });
  });

  it("cookbooks.byId resolves sharedBy for both the cookbook and its recipes in exactly one batched user-collection query", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      const sharedCookbook = await new Cookbook({
        name: "Owner's Cookbook", userId: owner.id, isPublic: false,
        recipes: [],
      }).save();
      await new Recipe({ name: "Owner's Other Recipe", userId: owner.id, isPublic: false }).save();

      const dbModule = await import("@/db");
      const getCollectionSpy = vi.spyOn(dbModule, "getBetterAuthCollection");

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.byId({ id: sharedCookbook.id });

      expect(result!.sharedBy).toEqual({ id: owner.id, name: owner.name });
      expect(getCollectionSpy).toHaveBeenCalledTimes(1);
      getCollectionSpy.mockRestore();
    });
  });

  it("a viewer-role collaborator (not just an editor) sees the unavailable stub for a cross-owner entry — accepted residual, design.md Decision 3", async () => {
    await withCleanDb(async () => {
      const { owner } = await seedLibraryShareGrant();
      const sharedRecipe = await new Recipe({ name: "Owner's Soup", userId: owner.id, isPublic: false }).save();
      const ownerCookbook = await new Cookbook({
        name: "Owner's Cookbook", userId: owner.id, isPublic: true,
        recipes: [{ recipeId: sharedRecipe.id, orderIndex: 0 }],
      }).save();
      const viewerCollaborator = await seedUserWithBetterAuth();
      await new Collaborator({ cookbookId: ownerCookbook.id, userId: viewerCollaborator.id, role: "viewer", addedBy: owner.id }).save();

      // Grant revoked so the entry can no longer resolve for anyone but a privileged viewer.
      const { LibraryShare } = await import("@/db/models");
      await LibraryShare.deleteMany({ ownerId: owner.id });

      const caller = await makeAuthCaller(viewerCollaborator.id, { collabCookbookIds: [ownerCookbook.id] });
      const result = await caller.cookbooks.byId({ id: ownerCookbook.id });

      expect(result!.recipes).toHaveLength(1);
      expect(result!.recipes[0]).toMatchObject({ recipeId: sharedRecipe.id, unavailable: true });
    });
  });

  it("a grantee viewing the owner's own cookbook (not their own, not a collaboration) never sees the unavailable stub for an entry that becomes inaccessible", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      const otherOwnerRecipe = await new Recipe({ name: "Third Owner's Soup", userId: owner.id, isPublic: false }).save();
      const ownerCookbook = await new Cookbook({
        name: "Owner's Cookbook", userId: owner.id, isPublic: false,
        recipes: [{ recipeId: otherOwnerRecipe.id, orderIndex: 0 }],
      }).save();

      // Soft-delete the referenced recipe so the entry can no longer resolve.
      await Recipe.updateOne({ _id: otherOwnerRecipe._id }, { $set: { deleted: true } });

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.byId({ id: ownerCookbook.id });

      // Recipient can still see the owner's cookbook itself (via the grant), but is not
      // a privileged viewer of it (not the owner, not a collaborator), so the
      // now-unresolvable entry is silently absent rather than shown as unavailable.
      expect(result).not.toBeNull();
      expect(result!.recipes).toHaveLength(0);
    });
  });

  it("the print route excludes cross-owner entries entirely (not rendered as unavailable, not rendered at all)", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      const sharedRecipe = await new Recipe({ name: "Owner's Soup", userId: owner.id, isPublic: false }).save();
      const ownRecipe = await new Recipe({ name: "My Own Recipe", userId: recipient.id, isPublic: false }).save();
      const ownCookbook = await new Cookbook({
        name: "My Cookbook", userId: recipient.id, isPublic: false,
        recipes: [
          { recipeId: sharedRecipe.id, orderIndex: 0 },
          { recipeId: ownRecipe.id, orderIndex: 1 },
        ],
      }).save();

      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.printById({ id: ownCookbook.id });

      const ids = result!.recipes.map((r) => r.id);
      expect(ids).toContain(ownRecipe.id);
      expect(ids).not.toContain(sharedRecipe.id);
      expect(JSON.stringify(result)).not.toContain("Owner's Soup");
    });
  });

  it("printById on the owner's own shared cookbook stays unreachable to a grantee (not an empty print view)", async () => {
    await withCleanDb(async () => {
      const { owner, recipient } = await seedLibraryShareGrant();
      const ownerCookbook = await new Cookbook({
        name: "Owner's Cookbook", userId: owner.id, isPublic: false, recipes: [],
      }).save();

      // Threading ctx.sharedOwnerIds into only the cookbook-level filter here would let
      // this resolve to a cookbook shell with an empty recipes[] (every recipe excluded
      // by the recipe-level filter) — worse than the pre-existing "not found" behavior,
      // since it looks like a real, correctly-empty print view rather than "no access."
      const caller = await callerFor(recipient.id);
      const result = await caller.cookbooks.printById({ id: ownerCookbook.id });

      expect(result).toBeNull();
    });
  });
});
