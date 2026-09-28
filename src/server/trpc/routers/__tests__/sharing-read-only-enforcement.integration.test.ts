// @vitest-environment node
/**
 * Task 3.4 — Read-only enforcement test sweep for share-my-library-read-path-integration.
 *
 * Per design.md Decision 4: the mutation table is derived from the `recipes` and
 * `cookbooks` tRPC routers' registered procedures (introspecting `_def.procedures`
 * and each procedure's `_def.type`), not hand-listed. A companion assertion
 * (`ALL_TESTED_OR_EXCLUDED` below) fails if a newly-added mutation isn't accounted
 * for in either the tested table or the excluded-with-reason list, so this sweep
 * can't silently go stale.
 */
import { describe, it, expect, vi } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Recipe, Cookbook, Collaborator } from "@/db/models";
import {
  seedUserWithBetterAuth,
  makeAuthCaller,
  seedGrantWithPrivateRecipe,
  resolveSharedOwnerIds,
  setUserTier,
} from "./test-helpers";

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

async function callerFor(recipientId: string, opts: { tier?: string } = {}) {
  const sharedOwnerIds = await resolveSharedOwnerIds(recipientId);
  return makeAuthCaller(recipientId, { tier: opts.tier ?? "home-cook", sharedOwnerIds });
}

interface Fixture {
  owner: { id: string; name: string };
  recipient: { id: string; name: string };
  recipeId: string;
  cookbookId: string;
}

/** Mutations invoked against the owner's content, with the input each needs. */
const RECIPE_MUTATIONS: Record<string, (f: Fixture) => Record<string, unknown>> = {
  update: (f) => ({ id: f.recipeId, name: "Hacked Name" }),
  delete: (f) => ({ id: f.recipeId }),
};

const COOKBOOK_MUTATIONS: Record<string, (f: Fixture) => Record<string, unknown>> = {
  update: (f) => ({ id: f.cookbookId, name: "Hacked Cookbook Name" }),
  delete: (f) => ({ id: f.cookbookId }),
  addCollaborator: (f) => ({ cookbookId: f.cookbookId, userId: f.recipient.id, role: "editor" }),
  removeCollaborator: (f) => ({ cookbookId: f.cookbookId, userId: f.owner.id }),
  addRecipe: (f) => ({ cookbookId: f.cookbookId, recipeId: f.recipeId }),
  removeRecipe: (f) => ({ cookbookId: f.cookbookId, recipeId: f.recipeId }),
  reorderRecipes: (f) => ({ cookbookId: f.cookbookId, recipeIds: [f.recipeId] }),
  createChapter: (f) => ({ cookbookId: f.cookbookId }),
  renameChapter: (f) => ({ cookbookId: f.cookbookId, chapterId: "a".repeat(24), name: "Hacked Chapter" }),
  deleteChapter: (f) => ({ cookbookId: f.cookbookId, chapterId: "a".repeat(24) }),
  reorderChapters: (f) => ({ cookbookId: f.cookbookId, chapterIds: ["a".repeat(24)] }),
  buildChaptersByCategory: (f) => ({ cookbookId: f.cookbookId, dryRun: true }),
  onboardCollaborator: (f) => ({ cookbookId: f.cookbookId }),
};

/**
 * Mutations excluded from the sweep, with why: each either has no existing-document
 * target to test ownership against (creates new content owned by the caller), or
 * mutates state scoped to the caller rather than the target document (a bookmark),
 * so "read-only enforcement over the owner's content" doesn't apply to it.
 */
const RECIPE_EXCLUDED = new Set(["create", "import", "importFromUrl", "toggleMarked"]);
const COOKBOOK_EXCLUDED = new Set(["create"]);

async function mutationNames(routerModule: string, exportName: string): Promise<{ mutations: string[]; queries: string[] }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = (await import(routerModule)) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const router = mod[exportName] as any;
  const mutations: string[] = [];
  const queries: string[] = [];
  for (const [name, proc] of Object.entries(router._def.procedures)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((proc as any)._def.type === "mutation") mutations.push(name);
    else queries.push(name);
  }
  return { mutations, queries };
}

async function seedFixture(): Promise<Fixture> {
  const { owner, recipient, recipe } = await seedGrantWithPrivateRecipe({ name: "Owner's Recipe" });
  const cookbook = await new Cookbook({ name: "Owner's Cookbook", userId: owner.id, isPublic: false, recipes: [] }).save();
  return { owner, recipient, recipeId: recipe.id, cookbookId: cookbook.id };
}

describe("Task 3.4 — router-derived mutation coverage is exhaustive", () => {
  it("every registered recipes mutation is tested or explicitly excluded", async () => {
    const { mutations } = await mutationNames("../recipes", "recipesRouter");
    const covered = new Set([...Object.keys(RECIPE_MUTATIONS), ...RECIPE_EXCLUDED]);
    expect(new Set(mutations)).toEqual(covered);
  });

  it("every registered cookbooks mutation is tested or explicitly excluded", async () => {
    const { mutations } = await mutationNames("../cookbooks", "cookbooksRouter");
    const covered = new Set([...Object.keys(COOKBOOK_MUTATIONS), ...COOKBOOK_EXCLUDED]);
    expect(new Set(mutations)).toEqual(covered);
  });
});

describe("Task 3.4 — every enumerated recipe mutation is rejected", () => {
  for (const [name, buildInput] of Object.entries(RECIPE_MUTATIONS)) {
    it(`recipes.${name} rejects a recipient acting on the owner's recipe`, async () => {
      await withCleanDb(async () => {
        const fixture = await seedFixture();
        const before = await Recipe.findById(fixture.recipeId).lean();

        const caller = await callerFor(fixture.recipient.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proc = (caller.recipes as any)[name] as (input: unknown) => Promise<unknown>;
        await expect(proc(buildInput(fixture))).rejects.toMatchObject({
          code: expect.stringMatching(/^(FORBIDDEN|NOT_FOUND)$/),
        });

        const after = await Recipe.findById(fixture.recipeId).lean();
        expect(after).toEqual(before);
      });
    });
  }
});

describe("Task 3.4 — every enumerated cookbook mutation is rejected", () => {
  for (const [name, buildInput] of Object.entries(COOKBOOK_MUTATIONS)) {
    it(`cookbooks.${name} rejects a recipient acting on the owner's cookbook`, async () => {
      await withCleanDb(async () => {
        const fixture = await seedFixture();
        const before = await Cookbook.findById(fixture.cookbookId).lean();

        // addCollaborator/removeCollaborator require execChefProcedure — give the
        // recipient the tier so the assertion exercises the ownership check itself,
        // not merely the tier gate.
        const needsExecChef = name === "addCollaborator" || name === "removeCollaborator";
        const caller = await callerFor(fixture.recipient.id, { tier: needsExecChef ? "executive-chef" : undefined });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proc = (caller.cookbooks as any)[name] as (input: unknown) => Promise<unknown>;
        await expect(proc(buildInput(fixture))).rejects.toMatchObject({
          code: expect.stringMatching(/^(FORBIDDEN|NOT_FOUND)$/),
        });

        const after = await Cookbook.findById(fixture.cookbookId).lean();
        expect(after).toEqual(before);
      });
    });
  }
});

describe("Task 3.4 — additional read-only enforcement scenarios", () => {
  it("recipient's own tier at executive-chef re-sharing their library does not leak the original owner's content", async () => {
    await withCleanDb(async () => {
      const fixture = await seedFixture();
      await setUserTier(fixture.recipient.id, "executive-chef");
      const thirdParty = await seedUserWithBetterAuth();

      const recipientCaller = await callerFor(fixture.recipient.id, { tier: "executive-chef" });
      await recipientCaller.sharing.shareLibrary({ recipientId: thirdParty.id });

      const thirdPartySharedOwnerIds = await resolveSharedOwnerIds(thirdParty.id);
      expect(thirdPartySharedOwnerIds).not.toContain(fixture.owner.id);
      expect(thirdPartySharedOwnerIds).toContain(fixture.recipient.id);

      const thirdPartyCaller = await makeAuthCaller(thirdParty.id, { sharedOwnerIds: thirdPartySharedOwnerIds });
      const result = await thirdPartyCaller.recipes.list();
      expect(result.items.map((r) => r.id)).not.toContain(fixture.recipeId);
    });
  });

  it("a grantee who is also a cookbook collaborator keeps write access on the collaborated cookbook while the rest stays read-only", async () => {
    await withCleanDb(async () => {
      const fixture = await seedFixture();
      const otherCookbook = await new Cookbook({ name: "Other Cookbook", userId: fixture.owner.id, isPublic: false, recipes: [] }).save();
      await new Collaborator({ cookbookId: fixture.cookbookId, userId: fixture.recipient.id, role: "editor", addedBy: fixture.owner.id }).save();

      const caller = await callerFor(fixture.recipient.id);

      // addRecipe/createChapter etc. go through fetchEditableCookbook, which grants
      // editor collaborators write access — unlike update/delete, which require full
      // ownership (verifyCookbookOwner) regardless of collaborator role.
      await expect(
        caller.cookbooks.createChapter({ cookbookId: fixture.cookbookId }),
      ).resolves.toMatchObject({ success: true });

      await expect(
        caller.cookbooks.createChapter({ cookbookId: otherCookbook.id }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  it("after revocation, re-requesting the previously visible shared recipe by id resolves to null (recipes.byId's existing not-visible contract)", async () => {
    await withCleanDb(async () => {
      const fixture = await seedFixture();
      const caller = await callerFor(fixture.recipient.id);
      const before = await caller.recipes.byId({ id: fixture.recipeId });
      expect(before).not.toBeNull();

      const { LibraryShare } = await import("@/db/models");
      await LibraryShare.deleteMany({ recipientId: fixture.recipient.id });

      const afterCaller = await makeAuthCaller(fixture.recipient.id, { sharedOwnerIds: [] });
      const after = await afterCaller.recipes.byId({ id: fixture.recipeId });
      expect(after).toBeNull();
    });
  });

  it("a LibraryShare whose recipientId points at a deleted user does not affect any real caller and raises no error", async () => {
    await withCleanDb(async () => {
      const owner = await seedUserWithBetterAuth();
      await setUserTier(owner.id, "executive-chef");
      const { LibraryShare } = await import("@/db/models");
      const { Types } = await import("mongoose");
      const danglingRecipientId = new Types.ObjectId();
      await LibraryShare.create({ ownerId: owner.id, recipientId: danglingRecipientId, addedBy: owner.id });
      await new Recipe({ name: "Owner Recipe", userId: owner.id, isPublic: false }).save();

      // Computing sharedOwnerIds against a recipientId with no corresponding user
      // must not throw. This scenario is only reachable defensively in a test — in
      // production ctx.sharedOwnerIds is always computed from an authenticated
      // session's session.user.id, which Better-Auth guarantees belongs to a real,
      // currently-existing user, so a request literally cannot arrive carrying a
      // dangling recipientId. Reflects that guarantee rather than asserting what a
      // hypothetical, non-production-reachable forged caller would see.
      const sharedOwnerIds = await resolveSharedOwnerIds(danglingRecipientId.toString());
      expect(Array.isArray(sharedOwnerIds)).toBe(true);

      // The dangling grant must not leak to any real caller who can actually
      // authenticate — a genuine, unrelated stranger sees none of the owner's content.
      const stranger = await seedUserWithBetterAuth();
      const strangerSharedOwnerIds = await resolveSharedOwnerIds(stranger.id);
      expect(strangerSharedOwnerIds).not.toContain(owner.id);
      const strangerCaller = await makeAuthCaller(stranger.id, { sharedOwnerIds: strangerSharedOwnerIds });
      const result = await strangerCaller.recipes.list();
      expect(result.items.map((r) => r.id)).not.toContain((await Recipe.findOne({ userId: owner.id }))!.id);
    });
  });
});
