// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Recipe, Cookbook, Classification, Source, Meal, Course, Preparation, Collaborator, Notification } from "@/db/models";
import {
  seedUserWithBetterAuth,
  uid,
  makeAnonCaller,
  makeAuthCaller,
  makeTieredCaller,
} from "./test-helpers";

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/lib/mail", () => ({ sendEmail: vi.fn().mockResolvedValue({ messageId: "123" }) }));

const seedUser = seedUserWithBetterAuth;

async function seedCookbook(
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return new Cookbook({
    userId,
    name: `Cookbook-${uid()}`,
    isPublic: true,
    ...overrides,
  }).save();
}

async function seedRecipe(userId: string) {
  return new Recipe({ name: `Recipe-${uid()}`, userId, isPublic: true }).save();
}

type Caller = Awaited<ReturnType<typeof makeAuthCaller>>;
type CookbookDoc = Awaited<ReturnType<typeof seedCookbook>>;
type RecipeDoc = Awaited<ReturnType<typeof seedRecipe>>;
type AnonCaller = Awaited<ReturnType<typeof makeAnonCaller>>;
type UserDoc = Awaited<ReturnType<typeof seedUser>>;

/** Attach recipes to a cookbook with sequential orderIndex values (0, 1, 2, …). */
async function seedCookbookWithRecipes(cookbookId: string, ...recipeIds: string[]) {
  await Cookbook.findByIdAndUpdate(cookbookId, {
    recipes: recipeIds.map((id, i) => ({ recipeId: id, orderIndex: i })),
  });
}

/** Seed a cookbook with two recipes inserted in reverse orderIndex (r1→1, r2→0). */
async function seedCookbookWithOrderedPair(ownerId: string) {
  const cb = await seedCookbook(ownerId);
  const r1 = await seedRecipe(ownerId);
  const r2 = await seedRecipe(ownerId);
  await seedCookbookWithRecipes(cb.id, r2.id, r1.id); // r2→0, r1→1
  return { cb, r1, r2 };
}

/** Register shared null-case tests for any public read procedure. */
function itNullCases(query: (caller: AnonCaller, id: string) => Promise<unknown>) {
  it.each([
    {
      label: "unknown cookbook ID",
      setup: async () => "000000000000000000000000",
    },
    {
      label: "private cookbook for anon user",
      setup: async () => {
        const owner = await seedUser();
        const cb = await seedCookbook(owner.id, { isPublic: false });
        return cb.id;
      },
    },
  ])("returns null for $label", async ({ setup }) => {
    await withCleanDb(async () => {
      const id = await setup();
      const caller = await makeAnonCaller();
      expect(await query(caller, id)).toBeNull();
    });
  });
}

// ─── Ownership guard ─────────────────────────────────────────────────────────

async function assertOwnershipGuard(
  act: (caller: Caller, cb: CookbookDoc, r: RecipeDoc) => Promise<any>,
) {
  await withCleanDb(async () => {
    const owner = await seedUser();
    const other = await seedUser();
    const cb = await seedCookbook(owner.id);
    const r = await seedRecipe(owner.id);
    const caller = await makeAuthCaller(other.id);
    await expect(act(caller, cb, r)).rejects.toThrow("Not your cookbook");
  });
}

type SetupCtx = { owner: UserDoc; cb: CookbookDoc; caller: Caller };
type SetupCtxWithRecipe = SetupCtx & { r: RecipeDoc };

// Convenience wrapper: seeds owner + cookbook + caller inside a clean DB.
async function withCookbookTest(fn: (ctx: SetupCtx) => Promise<void>): Promise<void> {
  await withCleanDb(async () => {
    const owner = await seedUser();
    const cb = await seedCookbook(owner.id);
    const caller = await makeAuthCaller(owner.id);
    await fn({ owner, cb, caller });
  });
}

// Same as above but also seeds a recipe.
async function withCookbookAndRecipeTest(fn: (ctx: SetupCtxWithRecipe) => Promise<void>): Promise<void> {
  await withCleanDb(async () => {
    const owner = await seedUser();
    const cb = await seedCookbook(owner.id);
    const r = await seedRecipe(owner.id);
    const caller = await makeAuthCaller(owner.id);
    await fn({ owner, cb, r, caller });
  });
}

describe("ownership guard — non-owner is rejected", () => {
  it.each([
    {
      label: "update",
      act: (caller: Caller, cb: CookbookDoc, _r: RecipeDoc) =>
        caller.cookbooks.update({ id: cb.id, name: "Hacked" }),
    },
    {
      label: "delete",
      act: (caller: Caller, cb: CookbookDoc, _r: RecipeDoc) =>
        caller.cookbooks.delete({ id: cb.id }),
    },
    {
      label: "addRecipe",
      act: (caller: Caller, cb: CookbookDoc, r: RecipeDoc) =>
        caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id }),
    },
    {
      label: "removeRecipe",
      act: (caller: Caller, cb: CookbookDoc, r: RecipeDoc) =>
        caller.cookbooks.removeRecipe({ cookbookId: cb.id, recipeId: r.id }),
    },
    {
      label: "reorderRecipes",
      act: (caller: Caller, cb: CookbookDoc, r: RecipeDoc) =>
        caller.cookbooks.reorderRecipes({
          cookbookId: cb.id,
          recipeIds: [r.id],
        }),
    },
    {
      label: "createChapter",
      act: (caller: Caller, cb: CookbookDoc, _r: RecipeDoc) =>
        caller.cookbooks.createChapter({ cookbookId: cb.id }),
    },
    {
      label: "renameChapter",
      act: (caller: Caller, cb: CookbookDoc, _r: RecipeDoc) =>
        caller.cookbooks.renameChapter({
          cookbookId: cb.id,
          chapterId: "000000000000000000000001",
          name: "Hacked",
        }),
    },
    {
      label: "deleteChapter",
      act: (caller: Caller, cb: CookbookDoc, _r: RecipeDoc) =>
        caller.cookbooks.deleteChapter({
          cookbookId: cb.id,
          chapterId: "000000000000000000000001",
        }),
    },
    {
      label: "reorderChapters",
      act: (caller: Caller, cb: CookbookDoc, _r: RecipeDoc) =>
        caller.cookbooks.reorderChapters({
          cookbookId: cb.id,
          chapterIds: ["000000000000000000000001"],
        }),
    },
    {
      label: "buildChaptersByCategory",
      act: (caller: Caller, cb: CookbookDoc, _r: RecipeDoc) =>
        caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id }),
    },
  ])("$label", async ({ act }) => {
    await assertOwnershipGuard(act);
  });
});

// ─── cookbooks.list ───────────────────────────────────────────────────────────

describe("cookbooks.list", () => {
  it("public cookbooks visible to all; private only to owner", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const publicCb = await seedCookbook(owner.id, { isPublic: true });
      const privateCb = await seedCookbook(owner.id, { isPublic: false });

      const anonCaller = await makeAnonCaller();
      const ownerCaller = await makeAuthCaller(owner.id);

      const anonIds = (await anonCaller.cookbooks.list()).map((c) => c.id);
      const ownerIds = (await ownerCaller.cookbooks.list()).map((c) => c.id);

      expect(anonIds).toContain(publicCb.id);
      expect(anonIds).not.toContain(privateCb.id);
      expect(ownerIds).toContain(privateCb.id);
    });
  });

  it("returns chapterCount = 0 for cookbook with no chapters", async () => {
    await withCookbookTest(async ({ caller }) => {
      const results = await caller.cookbooks.list();
      expect(results[0].chapterCount).toBe(0);
    });
  });

  it("returns chapterCount matching the number of chapters", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await caller.cookbooks.createChapter({ cookbookId: cb.id });
      const results = await caller.cookbooks.list();
      const found = results.find((c) => c.id === cb.id);
      expect(found!.chapterCount).toBe(2);
    });
  });

  it("TC-3.1: returns userId as a string for each item", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      await seedCookbook(owner.id);
      const caller = await makeAuthCaller(owner.id);
      const results = await caller.cookbooks.list();
      expect(results.length).toBeGreaterThan(0);
      for (const cb of results) {
        expect(typeof cb.userId).toBe("string");
        expect(cb.userId).toBe(owner.id);
      }
    });
  });

  it("TC-3.2: returns userId on public cookbooks for anonymous caller", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      await seedCookbook(owner.id, { isPublic: true });
      const caller = await makeAnonCaller();
      const results = await caller.cookbooks.list();
      expect(results.length).toBeGreaterThan(0);
      for (const cb of results) {
        expect(typeof cb.userId).toBe("string");
      }
    });
  });
});

// ─── cookbooks.byId ──────────────────────────────────────────────────────────

describe("cookbooks.byId", () => {
  itNullCases((caller, id) => caller.cookbooks.byId({ id }));

  it("returns empty chapters array when no chapters exist", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const caller = await makeAnonCaller();
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.chapters).toEqual([]);
    });
  });

  it("returns chapters sorted by orderIndex with chapterId on recipes", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const r1 = await seedRecipe(owner.id);
      const caller = await makeAuthCaller(owner.id);

      const { chapterId } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r1.id, chapterId });

      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.chapters).toHaveLength(1);
      expect(result!.chapters[0]).toMatchObject({ name: "Chapter 1", orderIndex: 0 });
      expect(result!.recipes[0].chapterId).toBe(chapterId);
    });
  });

  it("returns cookbook with recipes ordered by orderIndex", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const { cb, r1, r2 } = await seedCookbookWithOrderedPair(owner.id);
      const caller = await makeAnonCaller();
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.recipes.map((r) => r.id)).toEqual([r2.id, r1.id]);
    });
  });

  it("does not expose private recipes to non-owners in a public cookbook", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const other = await seedUser();
      const cb = await seedCookbook(owner.id, { isPublic: true });
      const publicRecipe = await seedRecipe(owner.id);
      const privateRecipe = await new Recipe({
        name: `PrivateRecipe-${uid()}`,
        userId: other.id,
        isPublic: false,
      }).save();

      await seedCookbookWithRecipes(cb.id, publicRecipe.id, privateRecipe.id);

      const caller = await makeAnonCaller();
      const result = await caller.cookbooks.byId({ id: cb.id });
      const ids = result!.recipes.map((r) => r.id);
      expect(ids).toContain(publicRecipe.id);
      expect(ids).not.toContain(privateRecipe.id);
    });
  });

  // Regression: Classification model must be registered for populate() to resolve classificationName
  it("returns classificationName on recipe stubs when recipe has a linked classification", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const cls = await new Classification({
        name: "Italian",
        slug: `italian-${uid()}`,
      }).save();
      const recipe = await new Recipe({
        name: "Pasta Dish",
        userId: owner.id,
        isPublic: true,
        classificationId: cls.id,
      }).save();

      await seedCookbookWithRecipes(cb.id, recipe.id);

      const caller = await makeAnonCaller();
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.recipes[0]).toMatchObject({
        classificationName: "Italian",
      });
    });
  });
});

// ─── cookbooks.create ─────────────────────────────────────────────────────────

describe("cookbooks.create", () => {
  it("rejects unauthenticated requests", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(caller.cookbooks.create({ name: "Test" })).rejects.toThrow(
        "UNAUTHORIZED",
      );
    });
  });

  it("rejects requests from users with unverified email", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const caller = await makeAuthCaller(user.id, { emailVerified: false });
      await expect(caller.cookbooks.create({ name: "Test" })).rejects.toThrow(
        "Email verification required",
      );
    });
  });

  it.each([
    [{ name: "My Recipes" }, { name: "My Recipes", isPublic: true }],
    [
      { name: "Private Eats", isPublic: false },
      { name: "Private Eats", isPublic: false, _tier: "sous-chef" as const },
    ],
    [
      { name: "With Desc", description: "A description" },
      { name: "With Desc", description: "A description" },
    ],
  ])(
    "creates cookbook with %o and returns the record",
    async (input, expected) => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const { _tier, ...exp } = expected as any;
        const caller = await makeAuthCaller(user.id, { tier: _tier ?? "home-cook" });
        expect(await caller.cookbooks.create(input)).toMatchObject({
          ...exp,
          userId: user.id,
        });
      });
    },
  );
});

// ─── cookbooks.update ────────────────────────────────────────────────────────

describe("cookbooks.update", () => {
  it("owner can update name and description", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id, { name: "Old Name" });
      const caller = await makeAuthCaller(owner.id);
      const result = await caller.cookbooks.update({
        id: cb.id,
        name: "New Name",
        description: "Updated",
      });
      expect(result).toMatchObject({
        id: cb.id,
        name: "New Name",
        description: "Updated",
      });
    });
  });
});

// ─── cookbooks.delete ────────────────────────────────────────────────────────

describe("cookbooks.delete", () => {
  it("owner can delete their cookbook and it becomes unfetchable", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const caller = await makeAuthCaller(owner.id);
      expect(await caller.cookbooks.delete({ id: cb.id })).toMatchObject({
        success: true,
      });
      expect(await caller.cookbooks.byId({ id: cb.id })).toBeNull();
    });
  });
});

// ─── cookbooks.addRecipe ─────────────────────────────────────────────────────

describe("cookbooks.addRecipe", () => {
  it("appends recipes in order and ignores duplicates", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const r1 = await seedRecipe(owner.id);
      const r2 = await seedRecipe(owner.id);
      const caller = await makeAuthCaller(owner.id);

      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r1.id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r2.id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r1.id }); // duplicate

      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.recipes.map((r) => r.id)).toEqual([r1.id, r2.id]);
    });
  });

  it("appends after max orderIndex even when gaps exist after a removal", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const r1 = await seedRecipe(owner.id);
      const r2 = await seedRecipe(owner.id);
      const r3 = await seedRecipe(owner.id);
      const caller = await makeAuthCaller(owner.id);

      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r1.id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r2.id });
      await caller.cookbooks.removeRecipe({
        cookbookId: cb.id,
        recipeId: r1.id,
      });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r3.id });

      const result = await caller.cookbooks.byId({ id: cb.id });
      const ids = result!.recipes.map((r) => r.id);
      expect(ids).toEqual([r2.id, r3.id]);
    });
  });

  it("rejects adding a private recipe owned by another user", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const other = await seedUser();
      const cb = await seedCookbook(owner.id);
      const privateRecipe = await new Recipe({
        name: `Private-${uid()}`,
        userId: other.id,
        isPublic: false,
      }).save();

      const caller = await makeAuthCaller(owner.id);
      await expect(
        caller.cookbooks.addRecipe({
          cookbookId: cb.id,
          recipeId: privateRecipe.id,
        }),
      ).rejects.toThrow("Recipe not found");
    });
  });
});

// ─── cookbooks.removeRecipe ──────────────────────────────────────────────────

describe("cookbooks.removeRecipe", () => {
  it("owner can remove a recipe from the cookbook", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const r = await seedRecipe(owner.id);
      await seedCookbookWithRecipes(cb.id, r.id);

      const caller = await makeAuthCaller(owner.id);
      await caller.cookbooks.removeRecipe({
        cookbookId: cb.id,
        recipeId: r.id,
      });

      expect(
        (await caller.cookbooks.byId({ id: cb.id }))!.recipes,
      ).toHaveLength(0);
    });
  });
});

// ─── cookbooks.printById ──────────────────────────────────────────────────────

describe("cookbooks.printById", () => {
  it("returns full recipe fields: ingredients, instructions, notes, prepTime, cookTime, servings, difficulty, calories, classificationName, sourceName, meals, courses, preparations", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);

      const cls = await new Classification({ name: "Italian", slug: `italian-${uid()}` }).save();
      const src = await new Source({ name: "Bon Appétit", url: "https://bonappetit.com", slug: "bon-appetit" }).save();
      const meal = await new Meal({ name: "Dinner", slug: `dinner-${uid()}` }).save();
      const course = await new Course({ name: "Entree", slug: `entree-${uid()}` }).save();
      const prep = await new Preparation({ name: "Bake", slug: `bake-${uid()}` }).save();

      const recipe = await new Recipe({
        name: `FullRecipe-${uid()}`,
        userId: owner.id,
        isPublic: true,
        ingredients: "Flour\nSugar",
        instructions: "Mix\nBake",
        notes: "Great recipe",
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: "easy",
        calories: 300,
        classificationId: cls.id,
        sourceId: src.id,
        mealIds: [meal.id],
        courseIds: [course.id],
        preparationIds: [prep.id],
      }).save();

      await seedCookbookWithRecipes(cb.id, recipe.id);

      const caller = await makeAnonCaller();
      const result = await caller.cookbooks.printById({ id: cb.id });

      expect(result).not.toBeNull();
      const r = result!.recipes[0];
      expect(r).toMatchObject({
        ingredients: "Flour\nSugar",
        instructions: "Mix\nBake",
        notes: "Great recipe",
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: "easy",
        calories: 300,
        classificationName: "Italian",
        sourceName: "Bon Appétit",
      });
      expect(r.meals).toEqual([{ id: meal.id, name: "Dinner" }]);
      expect(r.courses).toEqual([{ id: course.id, name: "Entree" }]);
      expect(r.preparations).toEqual([{ id: prep.id, name: "Bake" }]);
    });
  });

  it("returns recipes in orderIndex order", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const { cb, r1, r2 } = await seedCookbookWithOrderedPair(owner.id);
      const caller = await makeAnonCaller();
      const result = await caller.cookbooks.printById({ id: cb.id });
      expect(result!.recipes.map((r) => r.id)).toEqual([r2.id, r1.id]);
    });
  });

  it("returns ownerName, collaborators list, and recipe addedByName for authorized owners/collaborators", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const collabUser = await seedUser();

      const cb = await seedCookbook(owner.id);
      await new Collaborator({ cookbookId: cb._id, userId: collabUser.id, role: "editor", addedBy: owner.id }).save();

      const recipe1 = await new Recipe({
        name: `Recipe1-${uid()}`,
        userId: owner.id,
        isPublic: true,
      }).save();
      const recipe2 = await new Recipe({
        name: `Recipe2-${uid()}`,
        userId: collabUser.id,
        isPublic: true,
      }).save();

      await seedCookbookWithRecipes(cb.id, recipe1.id, recipe2.id);

      // Log in as collaborator
      const caller = await makeAuthCaller(collabUser.id, { collabCookbookIds: [cb.id] });
      const result = await caller.cookbooks.printById({ id: cb.id });

      expect(result).not.toBeNull();
      expect(result!.ownerName).toBe(owner.name);
      expect(result!.collaborators).toHaveLength(1);
      expect(result!.collaborators![0]).toMatchObject({
        userId: collabUser.id,
        name: collabUser.name,
        role: "editor",
      });

      const r1 = result!.recipes.find((r) => r.id === recipe1.id);
      const r2 = result!.recipes.find((r) => r.id === recipe2.id);
      expect(r1).toBeDefined();
      expect(r1!.addedByName).toBe(owner.name);
      expect(r2).toBeDefined();
      expect(r2!.addedByName).toBe(collabUser.name);
    });
  });

  it("returns ownerName and recipe addedByName but empty collaborators list for anonymous query on public cookbook", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const collabUser = await seedUser();

      const cb = await seedCookbook(owner.id, { isPublic: true });
      await new Collaborator({ cookbookId: cb._id, userId: collabUser.id, role: "editor", addedBy: owner.id }).save();

      const recipe = await new Recipe({
        name: `Recipe-${uid()}`,
        userId: owner.id,
        isPublic: true,
      }).save();

      await seedCookbookWithRecipes(cb.id, recipe.id);

      const caller = await makeAnonCaller();
      const result = await caller.cookbooks.printById({ id: cb.id });

      expect(result).not.toBeNull();
      expect(result!.ownerName).toBe(owner.name);
      expect(result!.collaborators).toHaveLength(0); // restricted

      const r = result!.recipes[0];
      expect(r.addedByName).toBe(owner.name);
    });
  });

  itNullCases((caller, id) => caller.cookbooks.printById({ id }));
});

// ─── cookbooks.reorderRecipes ────────────────────────────────────────────────

describe("cookbooks.reorderRecipes", () => {
  it("persists new recipe order", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const [r1, r2, r3] = await Promise.all([
        seedRecipe(owner.id),
        seedRecipe(owner.id),
        seedRecipe(owner.id),
      ]);

      await seedCookbookWithRecipes(cb.id, r1.id, r2.id, r3.id);

      const caller = await makeAuthCaller(owner.id);
      await caller.cookbooks.reorderRecipes({
        cookbookId: cb.id,
        recipeIds: [r3.id, r1.id, r2.id],
      });

      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.recipes.map((r) => r.id)).toEqual([r3.id, r1.id, r2.id]);
    });
  });

  it("preserves original orderIndex for recipes omitted from the reorder list", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const [r1, r2] = await Promise.all([
        seedRecipe(owner.id),
        seedRecipe(owner.id),
      ]);

      await seedCookbookWithRecipes(cb.id, r1.id, r2.id);

      const caller = await makeAuthCaller(owner.id);
      // Pass only r2 in the reorder list — r1 keeps its original orderIndex (0)
      await caller.cookbooks.reorderRecipes({
        cookbookId: cb.id,
        recipeIds: [r2.id],
      });

      const result = await caller.cookbooks.byId({ id: cb.id });
      // r1 retains orderIndex 0; r2 gets orderIndex 0 too (position in new list).
      // byId sorts by orderIndex then by insertion order, so both at 0 come back in stable order.
      const ids = result!.recipes.map((r) => r.id);
      expect(ids).toContain(r1.id);
      expect(ids).toContain(r2.id);
    });
  });

  it("persists within-chapter reorder via chapters format", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const [r1, r2, r3] = await Promise.all([
        seedRecipe(owner.id),
        seedRecipe(owner.id),
        seedRecipe(owner.id),
      ]);
      const caller = await makeAuthCaller(owner.id);
      const { chapterId } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r1.id, chapterId });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r2.id, chapterId });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r3.id, chapterId });

      await caller.cookbooks.reorderRecipes({
        cookbookId: cb.id,
        chapters: [{ chapterId, recipeIds: [r3.id, r1.id, r2.id] }],
      });

      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.recipes.map((r) => r.id)).toEqual([r3.id, r1.id, r2.id]);
    });
  });

  it("persists cross-chapter recipe move via chapters format", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const [r1, r2] = await Promise.all([
        seedRecipe(owner.id),
        seedRecipe(owner.id),
      ]);
      const caller = await makeAuthCaller(owner.id);
      const { chapterId: ch1Id } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      const { chapterId: ch2Id } = await caller.cookbooks.createChapter({ cookbookId: cb.id });

      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r1.id, chapterId: ch1Id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r2.id, chapterId: ch2Id });

      // Move r1 from ch1 to ch2
      await caller.cookbooks.reorderRecipes({
        cookbookId: cb.id,
        chapters: [
          { chapterId: ch1Id, recipeIds: [] },
          { chapterId: ch2Id, recipeIds: [r2.id, r1.id] },
        ],
      });

      const result = await caller.cookbooks.byId({ id: cb.id });
      const movedRecipe = result!.recipes.find((r) => r.id === r1.id);
      expect(movedRecipe!.chapterId).toBe(ch2Id);
    });
  });
});

// ─── cookbooks.createChapter ─────────────────────────────────────────────────

describe("cookbooks.createChapter", () => {
  it("creates first chapter named 'Chapter 1' and migrates existing recipes", async () => {
    await withCookbookAndRecipeTest(async ({ cb, r, caller }) => {
      await seedCookbookWithRecipes(cb.id, r.id);
      const { chapterId } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.chapters).toHaveLength(1);
      expect(result!.chapters[0]).toMatchObject({ name: "Chapter 1", orderIndex: 0 });
      expect(result!.recipes[0].chapterId).toBe(chapterId);
    });
  });

  it("creates a second chapter empty without reassigning recipes", async () => {
    await withCookbookAndRecipeTest(async ({ cb, r, caller }) => {
      const { chapterId: ch1Id } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id, chapterId: ch1Id });
      await caller.cookbooks.createChapter({ cookbookId: cb.id });
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.chapters).toHaveLength(2);
      expect(result!.chapters[1]).toMatchObject({ name: "Chapter 2", orderIndex: 1 });
      expect(result!.recipes[0].chapterId).toBe(ch1Id);
    });
  });
});

// ─── cookbooks.renameChapter ─────────────────────────────────────────────────

describe("cookbooks.renameChapter", () => {
  it("owner can rename a chapter", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const { chapterId } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await caller.cookbooks.renameChapter({ cookbookId: cb.id, chapterId, name: "Starters" });
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.chapters[0].name).toBe("Starters");
    });
  });
});

// ─── cookbooks.deleteChapter ─────────────────────────────────────────────────

describe("cookbooks.deleteChapter", () => {
  it("deletes a chapter and moves its recipes to the first remaining chapter", async () => {
    await withCookbookAndRecipeTest(async ({ cb, r, caller }) => {
      const { chapterId: ch1Id } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      const { chapterId: ch2Id } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id, chapterId: ch2Id });
      await caller.cookbooks.deleteChapter({ cookbookId: cb.id, chapterId: ch2Id });
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.chapters).toHaveLength(1);
      expect(result!.chapters[0].id).toBe(ch1Id);
      expect(result!.recipes[0].chapterId).toBe(ch1Id);
    });
  });

  it("deletes the last chapter and clears chapterId from all recipes", async () => {
    await withCookbookAndRecipeTest(async ({ cb, r, caller }) => {
      const { chapterId } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id, chapterId });
      await caller.cookbooks.deleteChapter({ cookbookId: cb.id, chapterId });
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.chapters).toHaveLength(0);
      expect(result!.recipes[0].chapterId).toBeNull();
    });
  });
});

// ─── cookbooks.reorderChapters ───────────────────────────────────────────────

describe("cookbooks.reorderChapters", () => {
  it("owner can reorder chapters", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const { chapterId: ch1Id } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      const { chapterId: ch2Id } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      const { chapterId: ch3Id } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await caller.cookbooks.reorderChapters({ cookbookId: cb.id, chapterIds: [ch3Id, ch1Id, ch2Id] });
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.chapters.map((c) => c.id)).toEqual([ch3Id, ch1Id, ch2Id]);
    });
  });
});

// ─── cookbooks.buildChaptersByCategory ───────────────────────────────────────

describe("cookbooks.buildChaptersByCategory", () => {
  async function seedClassification(name: string) {
    return new Classification({ name, slug: `${name.trim().toLowerCase().replace(/\s+/g, "-")}-${uid()}` }).save();
  }

  it("dry-run groups unchaptered recipes by category and returns a summary without writing", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const cls = await seedClassification("Dessert");
      const recipe = await new Recipe({ name: "Cake", userId: cb.userId, isPublic: true, classificationId: cls.id }).save();
      await seedCookbookWithRecipes(cb.id, recipe.id);

      const findByIdAndUpdateSpy = vi.spyOn(Cookbook, "findByIdAndUpdate");
      try {
        const result = await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id, dryRun: true });
        expect(result.summary.created).toEqual([{ name: "Dessert", recipeCount: 1 }]);
        expect(result.summary.merged).toEqual([]);
        expect(findByIdAndUpdateSpy).not.toHaveBeenCalled();
        const persisted = await caller.cookbooks.byId({ id: cb.id });
        expect(persisted!.chapters).toHaveLength(0);
      } finally {
        findByIdAndUpdateSpy.mockRestore();
      }
    });
  });

  it("recipe with classificationId: null is grouped into an Uncategorized chapter", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const recipe = await new Recipe({ name: "Mystery Dish", userId: cb.userId, isPublic: true }).save();
      await seedCookbookWithRecipes(cb.id, recipe.id);

      await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });

      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.chapters).toHaveLength(1);
      expect(result!.chapters[0].name).toBe("Uncategorized");
      expect(result!.recipes[0].chapterId).toBe(result!.chapters[0].id);
    });
  });

  it("category matching an existing chapter name (case-insensitive/trimmed) merges instead of duplicating", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const existingChapterId = new Types.ObjectId();
      await Cookbook.findByIdAndUpdate(cb.id, {
        chapters: [{ _id: existingChapterId, name: "Dessert", orderIndex: 0 }],
      });
      const cls = await seedClassification("dessert ");
      const recipe = await new Recipe({ name: "Pie", userId: cb.userId, isPublic: true, classificationId: cls.id }).save();
      await Cookbook.findByIdAndUpdate(cb.id, { $set: { recipes: [{ recipeId: recipe.id, orderIndex: 0 }] } });

      await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });

      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.chapters).toHaveLength(1);
      expect(result!.chapters[0].id).toBe(String(existingChapterId));
      expect(result!.chapters[0].orderIndex).toBe(0);
      expect(result!.recipes[0].chapterId).toBe(String(existingChapterId));
    });
  });

  it("two new categories that differ only by case/whitespace collapse into a single new chapter, not duplicates", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const bbqUpper = await seedClassification("BBQ");
      const bbqLower = await seedClassification("bbq ");
      const r1 = await new Recipe({ name: "Ribs", userId: cb.userId, isPublic: true, classificationId: bbqUpper.id }).save();
      const r2 = await new Recipe({ name: "Brisket", userId: cb.userId, isPublic: true, classificationId: bbqLower.id }).save();
      await seedCookbookWithRecipes(cb.id, r1.id, r2.id);

      const result = await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });
      expect(result.summary.created).toHaveLength(1);
      expect(result.summary.created[0].recipeCount).toBe(2);

      const persisted = await caller.cookbooks.byId({ id: cb.id });
      expect(persisted!.chapters).toHaveLength(1);
      expect(persisted!.recipes.every((r) => r.chapterId === persisted!.chapters[0].id)).toBe(true);
    });
  });

  it("creates new chapters for non-matching categories, ordered alphabetically after the existing max orderIndex", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      await Cookbook.findByIdAndUpdate(cb.id, {
        chapters: [{ _id: new Types.ObjectId(), name: "Family Favorites", orderIndex: 0 }],
      });
      const breakfast = await seedClassification("Breakfast");
      const appetizer = await seedClassification("Appetizer");
      const r1 = await new Recipe({ name: "Pancakes", userId: cb.userId, isPublic: true, classificationId: breakfast.id }).save();
      const r2 = await new Recipe({ name: "Bruschetta", userId: cb.userId, isPublic: true, classificationId: appetizer.id }).save();
      await Cookbook.findByIdAndUpdate(cb.id, {
        $set: {
          recipes: [
            { recipeId: r1.id, orderIndex: 0 },
            { recipeId: r2.id, orderIndex: 1 },
          ],
        },
      });

      await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });

      const result = await caller.cookbooks.byId({ id: cb.id });
      const chapters = result!.chapters.slice().sort((a, b) => a.orderIndex - b.orderIndex);
      expect(chapters.map((c) => c.name)).toEqual(["Family Favorites", "Appetizer", "Breakfast"]);
      expect(chapters[1].orderIndex).toBe(1);
      expect(chapters[2].orderIndex).toBe(2);
    });
  });

  it("on a chapter-free cookbook, new chapters start at orderIndex 0 and every recipe gets a chapterId (first-chapter parity)", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const breakfast = await seedClassification("Breakfast");
      const dessert = await seedClassification("Dessert");
      const r1 = await new Recipe({ name: "Waffles", userId: cb.userId, isPublic: true, classificationId: breakfast.id }).save();
      const r2 = await new Recipe({ name: "Cake", userId: cb.userId, isPublic: true, classificationId: dessert.id }).save();
      await seedCookbookWithRecipes(cb.id, r1.id, r2.id);

      await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });

      const result = await caller.cookbooks.byId({ id: cb.id });
      const chapters = result!.chapters.slice().sort((a, b) => a.orderIndex - b.orderIndex);
      expect(chapters.map((c) => c.orderIndex)).toEqual([0, 1]);
      expect(result!.recipes.every((r) => r.chapterId !== null)).toBe(true);
    });
  });

  it("leaves already-chaptered recipes' chapterId and orderIndex byte-identical", async () => {
    await withCookbookAndRecipeTest(async ({ cb, r, caller }) => {
      const { chapterId } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id, chapterId });
      const before = await caller.cookbooks.byId({ id: cb.id });
      const beforeStub = before!.recipes.find((x) => x.id === r.id)!;

      const unchapteredRecipe = await new Recipe({ name: "Extra", userId: cb.userId, isPublic: true }).save();
      await Cookbook.findByIdAndUpdate(cb.id, { $push: { recipes: { recipeId: unchapteredRecipe.id, orderIndex: 5 } } });

      await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });

      const after = await caller.cookbooks.byId({ id: cb.id });
      const afterStub = after!.recipes.find((x) => x.id === r.id)!;
      expect(afterStub.chapterId).toBe(beforeStub.chapterId);
      expect(afterStub.orderIndex).toBe(beforeStub.orderIndex);
    });
  });

  it("is a no-op (zero created/merged, no write) when every recipe stub already has a chapterId", async () => {
    await withCookbookAndRecipeTest(async ({ cb, r, caller }) => {
      const { chapterId } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id, chapterId });

      const findByIdAndUpdateSpy = vi.spyOn(Cookbook, "findByIdAndUpdate");
      try {
        const result = await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });
        expect(result.summary).toEqual({ created: [], merged: [] });
        expect(findByIdAndUpdateSpy).not.toHaveBeenCalled();
      } finally {
        findByIdAndUpdateSpy.mockRestore();
      }
    });
  });

  it("is a no-op (no write) when every unchaptered stub is unresolvable (invisible or deleted)", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const editor = await seedUser();
      const otherUser = await seedUser();
      const cb = await seedCookbook(owner.id);
      await new Collaborator({ cookbookId: cb._id, userId: editor.id, role: "editor", addedBy: owner.id }).save();
      const privateRecipe = await new Recipe({ name: "Secret Sauce", userId: otherUser.id, isPublic: false }).save();
      await seedCookbookWithRecipes(cb.id, privateRecipe.id);

      const findByIdAndUpdateSpy = vi.spyOn(Cookbook, "findByIdAndUpdate");
      try {
        const caller = await makeAuthCaller(editor.id, { collabCookbookIds: [cb.id] });
        const result = await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });
        expect(result.summary).toEqual({ created: [], merged: [] });
        expect(findByIdAndUpdateSpy).not.toHaveBeenCalled();
      } finally {
        findByIdAndUpdateSpy.mockRestore();
      }
    });
  });

  it("assigns new orderIndex values that don't collide with a legacy chaptered stub missing orderIndex", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const chapteredRecipe = await new Recipe({ name: "Legacy", userId: cb.userId, isPublic: true }).save();
      const unchapteredRecipe = await new Recipe({ name: "New", userId: cb.userId, isPublic: true }).save();
      const legacyChapterId = new Types.ObjectId();
      await Cookbook.findByIdAndUpdate(cb.id, {
        $set: {
          chapters: [{ _id: legacyChapterId, name: "Legacy Chapter", orderIndex: 0 }],
          // Simulate legacy data: the chaptered stub has no orderIndex field at all, which the
          // rest of the codebase (fetchCookbookWithOrderedStubs) sorts as if it were 0.
          recipes: [
            { recipeId: chapteredRecipe.id, chapterId: legacyChapterId },
            { recipeId: unchapteredRecipe.id, orderIndex: 0 },
          ],
        },
      });

      await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });

      const persisted = await Cookbook.findById(cb.id).lean();
      const newlyChaptered = persisted!.recipes.find(
        (r: { recipeId: unknown }) => String(r.recipeId) === String(unchapteredRecipe.id),
      );
      // The new stub must not be assigned orderIndex 0, since the legacy chaptered stub with no
      // orderIndex field sorts as 0 elsewhere in the codebase -- a collision would make ordering
      // ambiguous between the legacy stub and the newly-chaptered one.
      expect(newlyChaptered.orderIndex).toBeGreaterThan(0);
    });
  });

  it("commit performs exactly one Cookbook.findByIdAndUpdate call with $set covering both chapters and recipes", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const recipe = await new Recipe({ name: "Soup", userId: cb.userId, isPublic: true }).save();
      await seedCookbookWithRecipes(cb.id, recipe.id);

      const findByIdAndUpdateSpy = vi.spyOn(Cookbook, "findByIdAndUpdate");
      try {
        await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });
        expect(findByIdAndUpdateSpy).toHaveBeenCalledTimes(1);
        const [, updateArg] = findByIdAndUpdateSpy.mock.calls[0];
        expect(updateArg).toMatchObject({
          $set: {
            chapters: expect.any(Array),
            recipes: expect.any(Array),
          },
        });
      } finally {
        findByIdAndUpdateSpy.mockRestore();
      }
    });
  });

  it("an editor collaborator can invoke the mutation successfully", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const editor = await seedUser();
      const cb = await seedCookbook(owner.id);
      await new Collaborator({ cookbookId: cb._id, userId: editor.id, role: "editor", addedBy: owner.id }).save();
      const recipe = await new Recipe({ name: "Toast", userId: owner.id, isPublic: true }).save();
      await seedCookbookWithRecipes(cb.id, recipe.id);

      const caller = await makeAuthCaller(editor.id, { collabCookbookIds: [cb.id] });
      const result = await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });
      expect(result.summary.created).toHaveLength(1);
    });
  });

  it("skips (does not chapter or leak) a stub whose recipe is not visible to the calling editor collaborator", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const editor = await seedUser();
      const otherUser = await seedUser();
      const cb = await seedCookbook(owner.id);
      await new Collaborator({ cookbookId: cb._id, userId: editor.id, role: "editor", addedBy: owner.id }).save();
      const cls = await seedClassification("Dessert");
      const visibleRecipe = await new Recipe({ name: "Cake", userId: owner.id, isPublic: true, classificationId: cls.id }).save();
      const privateRecipe = await new Recipe({ name: "Secret Sauce", userId: otherUser.id, isPublic: false, classificationId: cls.id }).save();
      await Cookbook.findByIdAndUpdate(cb.id, {
        $set: {
          recipes: [
            { recipeId: visibleRecipe.id, orderIndex: 0 },
            { recipeId: privateRecipe.id, orderIndex: 1 },
          ],
        },
      });

      const caller = await makeAuthCaller(editor.id, { collabCookbookIds: [cb.id] });
      const result = await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });
      expect(result.summary.created).toEqual([{ name: "Dessert", recipeCount: 1 }]);

      // Query the raw persisted document (not the visibility-filtered byId projection) to prove
      // the invisible recipe's stub was left untouched rather than silently chaptered.
      const persisted = await Cookbook.findById(cb.id).lean();
      const privateStub = persisted!.recipes.find(
        (r: { recipeId: unknown }) => String(r.recipeId) === String(privateRecipe.id),
      );
      expect(privateStub.chapterId).toBeUndefined();
    });
  });

  it("orders grouped stubs by orderIndex, not by raw array position, since cookbook.recipes isn't guaranteed sorted", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const recipeA = await new Recipe({ name: "A - orderIndex 1", userId: cb.userId, isPublic: true }).save();
      const recipeB = await new Recipe({ name: "B - orderIndex 5", userId: cb.userId, isPublic: true }).save();
      // Store the higher-orderIndex stub first in array order, to prove grouping/reassignment
      // follows orderIndex rather than array position.
      await Cookbook.findByIdAndUpdate(cb.id, {
        $set: {
          recipes: [
            { recipeId: recipeB.id, orderIndex: 5 },
            { recipeId: recipeA.id, orderIndex: 1 },
          ],
        },
      });

      await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });

      const persisted = await Cookbook.findById(cb.id).lean();
      const stubFor = (id: string) =>
        persisted!.recipes.find((r: { recipeId: unknown }) => String(r.recipeId) === id);
      expect(stubFor(String(recipeA.id)).orderIndex).toBeLessThan(stubFor(String(recipeB.id)).orderIndex);
    });
  });

  it("a viewer collaborator (read-only role, not merely a non-collaborator) is rejected", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const viewer = await seedUser();
      const cb = await seedCookbook(owner.id);
      await new Collaborator({ cookbookId: cb._id, userId: viewer.id, role: "viewer", addedBy: owner.id }).save();
      const recipe = await new Recipe({ name: "Toast", userId: owner.id, isPublic: true }).save();
      await seedCookbookWithRecipes(cb.id, recipe.id);

      const caller = await makeAuthCaller(viewer.id, { collabCookbookIds: [cb.id] });
      await expect(caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id })).rejects.toThrow(
        "Not your cookbook",
      );
    });
  });

  it("a new chapter's display name is trimmed even when the source category has leading/trailing whitespace", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const cls = await seedClassification("  Dessert  ");
      const recipe = await new Recipe({ name: "Cake", userId: cb.userId, isPublic: true, classificationId: cls.id }).save();
      await seedCookbookWithRecipes(cb.id, recipe.id);

      const result = await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });
      expect(result.summary.created).toEqual([{ name: "Dessert", recipeCount: 1 }]);

      const persisted = await caller.cookbooks.byId({ id: cb.id });
      expect(persisted!.chapters[0].name).toBe("Dessert");
    });
  });

  it("merges into the existing chapter with the lowest orderIndex when duplicate chapter names exist", async () => {
    await withCookbookTest(async ({ cb, caller }) => {
      const laterChapterId = new Types.ObjectId();
      const earlierChapterId = new Types.ObjectId();
      // Deliberately push the lower-orderIndex duplicate second in array order, to prove the
      // merge target is chosen by orderIndex rather than by array/iteration order.
      await Cookbook.findByIdAndUpdate(cb.id, {
        chapters: [
          { _id: laterChapterId, name: "Dessert", orderIndex: 5 },
          { _id: earlierChapterId, name: "dessert", orderIndex: 1 },
        ],
      });
      const cls = await seedClassification("Dessert");
      const recipe = await new Recipe({ name: "Pie", userId: cb.userId, isPublic: true, classificationId: cls.id }).save();
      await Cookbook.findByIdAndUpdate(cb.id, { $set: { recipes: [{ recipeId: recipe.id, orderIndex: 0 }] } });

      await caller.cookbooks.buildChaptersByCategory({ cookbookId: cb.id });

      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.recipes[0].chapterId).toBe(String(earlierChapterId));
    });
  });
});

// ─── cookbooks.addRecipe (chapter-aware) ─────────────────────────────────────

describe("cookbooks.addRecipe (chapter-aware)", () => {
  it("adds recipe with chapterId when chapters exist", async () => {
    await withCookbookAndRecipeTest(async ({ cb, r, caller }) => {
      const { chapterId } = await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id, chapterId });
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.recipes[0].chapterId).toBe(chapterId);
    });
  });

  it("throws BAD_REQUEST when chapters exist but chapterId is missing", async () => {
    await withCookbookAndRecipeTest(async ({ cb, r, caller }) => {
      await caller.cookbooks.createChapter({ cookbookId: cb.id });
      await expect(
        caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id }),
      ).rejects.toThrow("chapterId is required");
    });
  });

  it("adds recipe without chapterId when no chapters exist", async () => {
    await withCookbookAndRecipeTest(async ({ cb, r, caller }) => {
      await caller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: r.id });
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result!.recipes[0].chapterId).toBeNull();
    });
  });
});

// ─── visibility enforcement (tier-based) ─────────────────────────────────────

describe("visibility enforcement", () => {
  describe("create", () => {
    it("Home Cook creates private cookbook -> coerced to public", async () => {
      await withCleanDb(async () => {
        const caller = await makeTieredCaller("home-cook");
        const result = await caller.cookbooks.create({ name: "Home Cook Private", isPublic: false });
        expect(result.isPublic).toBe(true);
      });
    });

    it("Prep Cook creates private cookbook -> coerced to public", async () => {
      await withCleanDb(async () => {
        const caller = await makeTieredCaller("prep-cook");
        const result = await caller.cookbooks.create({ name: "Prep Cook Private", isPublic: false });
        expect(result.isPublic).toBe(true);
      });
    });

    it("Sous Chef creates private cookbook -> remains private", async () => {
      await withCleanDb(async () => {
        const caller = await makeTieredCaller("sous-chef");
        const result = await caller.cookbooks.create({ name: "Sous Chef Private", isPublic: false });
        expect(result.isPublic).toBe(false);
      });
    });
  });

  describe("update", () => {
    it("Prep Cook updates cookbook to private -> rejected with PAYMENT_REQUIRED", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const cb = await seedCookbook(user.id, { isPublic: true });
        const caller = await makeAuthCaller(user.id, { tier: "prep-cook" });
        await expect(caller.cookbooks.update({ id: cb.id, isPublic: false })).rejects.toMatchObject({ code: "PAYMENT_REQUIRED" });
        const persisted = await Cookbook.findById(cb.id).lean();
        expect(persisted?.isPublic).toBe(true);
      });
    });

    it("Sous Chef updates cookbook to private -> allowed", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const cb = await seedCookbook(user.id, { isPublic: true });
        const caller = await makeAuthCaller(user.id, { tier: "sous-chef" });
        const result = await caller.cookbooks.update({ id: cb.id, isPublic: false });
        expect(result?.isPublic).toBe(false);
      });
    });

    it("Admin updates cookbook to private -> allowed", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const cb = await seedCookbook(user.id, { isPublic: true });
        const caller = await makeAuthCaller(user.id, { tier: "home-cook", isAdmin: true });
        const result = await caller.cookbooks.update({ id: cb.id, isPublic: false });
        expect(result?.isPublic).toBe(false);
      });
    });
  });
});

// ─── cookbooks.create — tier content limit enforcement ───────────────────────

async function withHomeCookCaller(
  setup: ((owner: UserDoc) => Promise<void>) | null,
  cb: (caller: Caller, owner: UserDoc) => Promise<void>,
  callerOpts: Parameters<typeof makeAuthCaller>[1] = { tier: "home-cook" },
) {
  await withCleanDb(async () => {
    const owner = await seedUser();
    if (setup) await setup(owner);
    const caller = await makeAuthCaller(owner.id, callerOpts);
    await cb(caller, owner);
  });
}

describe("cookbooks.create — tier limit enforcement", () => {
  it("throws PAYMENT_REQUIRED when home-cook user already has 1 cookbook (at limit)", async () => {
    await withHomeCookCaller(
      (owner) => seedCookbook(owner.id).then(() => undefined),
      (caller) => expect(caller.cookbooks.create({ name: "Second Cookbook" })).rejects.toMatchObject({ code: "PAYMENT_REQUIRED" }),
    );
  });

  it("tier: undefined (omitted) is blocked at home-cook cookbook limit of 1", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      await seedCookbook(owner.id);
      // Omit tier from makeAuthCaller opts — simulates tier: undefined
      const caller = await makeAuthCaller(owner.id);
      await expect(caller.cookbooks.create({ name: "Second Cookbook" })).rejects.toMatchObject({ code: "PAYMENT_REQUIRED" });
    });
  });

  it("succeeds when home-cook user has 0 cookbooks (under limit)", async () => {
    await withHomeCookCaller(null, async (caller) => {
      const result = await caller.cookbooks.create({ name: "First Cookbook" });
      expect(result).toMatchObject({ name: "First Cookbook" });
    });
  });

  it("admin user bypasses the cookbook limit", async () => {
    await withHomeCookCaller(
      (owner) => seedCookbook(owner.id).then(() => undefined),
      async (caller) => {
        const result = await caller.cookbooks.create({ name: "Admin Extra" });
        expect(result).toMatchObject({ name: "Admin Extra" });
      },
      { tier: "home-cook", isAdmin: true },
    );
  });

  it("hiddenByTier cookbook excluded from count — 1 hidden allows create", async () => {
    await withHomeCookCaller(
      (owner) => new Cookbook({ name: "Hidden Cookbook", userId: owner.id, isPublic: true, hiddenByTier: true }).save().then(() => undefined),
      async (caller) => {
        const result = await caller.cookbooks.create({ name: "Active First" });
        expect(result).toMatchObject({ name: "Active First" });
      },
    );
  });

  it("create response includes hiddenByTier: false", async () => {
    await withHomeCookCaller(null, async (caller) => {
      const result = await caller.cookbooks.create({ name: "New Cookbook" });
      expect(result.hiddenByTier).toBe(false);
    });
  });
});

// ─── cookbooks.list — hiddenByTier in response ───────────────────────────────

describe("cookbooks.list — hiddenByTier in response", () => {
  it("list items include hiddenByTier: false by default", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      await seedCookbook(owner.id);
      const caller = await makeAuthCaller(owner.id);
      const results = await caller.cookbooks.list();
      expect(results).toHaveLength(1);
      expect(results[0].hiddenByTier).toBe(false);
    });
  });

  it("owner cannot see hiddenByTier cookbook in list", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      await new Cookbook({ name: "Visible Cookbook", userId: owner.id, isPublic: true }).save();
      await new Cookbook({
        name: "Hidden Cookbook",
        userId: owner.id,
        isPublic: true,
        hiddenByTier: true,
        recipes: [],
      }).save();
      const caller = await makeAuthCaller(owner.id);
      const results = await caller.cookbooks.list();
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Visible Cookbook");
    });
  });

  it("owner cannot see hiddenByTier private cookbook in list", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      await new Cookbook({ name: "Visible Private Cookbook", userId: owner.id, isPublic: false }).save();
      await new Cookbook({
        name: "Hidden Private Cookbook",
        userId: owner.id,
        isPublic: false,
        hiddenByTier: true,
        recipes: [],
      }).save();
      const caller = await makeAuthCaller(owner.id);
      const results = await caller.cookbooks.list();
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Visible Private Cookbook");
    });
  });
});

describe("cookbooks.byId — hiddenByTier (owner exclusion)", () => {
  it("owner cannot see own hiddenByTier cookbook byId — returns null", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const hiddenCb = await new Cookbook({
        name: "Hidden Cookbook",
        userId: owner.id,
        isPublic: true,
        hiddenByTier: true,
        recipes: [],
      }).save();
      const caller = await makeAuthCaller(owner.id);
      const result = await caller.cookbooks.byId({ id: hiddenCb.id });
      expect(result).toBeNull();
    });
  });

  it("owner cannot see own hiddenByTier private cookbook byId — returns null", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const hiddenCb = await new Cookbook({
        name: "Hidden Private Cookbook",
        userId: owner.id,
        isPublic: false,
        hiddenByTier: true,
        recipes: [],
      }).save();
      const caller = await makeAuthCaller(owner.id);
      const result = await caller.cookbooks.byId({ id: hiddenCb.id });
      expect(result).toBeNull();
    });
  });
});

describe("cookbooks.byId — hiddenByTier in response", () => {
  it("byId response includes hiddenByTier: false by default", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const caller = await makeAnonCaller();
      const result = await caller.cookbooks.byId({ id: cb.id });
      expect(result).not.toBeNull();
      expect(result!.hiddenByTier).toBe(false);
    });
  });
});

describe("cookbooks.addCollaborator", () => {
  it("adds a collaborator and returns { success: true }", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const target = await seedUser();
      const cb = await seedCookbook(owner.id);
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      const result = await caller.cookbooks.addCollaborator({
        cookbookId: cb.id,
        userId: target.id,
        role: "editor",
      });

      expect(result).toEqual({ success: true });
      const collab = await Collaborator.findOne({ cookbookId: cb._id, userId: target.id });
      expect(collab).not.toBeNull();
      expect(collab!.role).toBe("editor");
    });
  });

  it("throws CONFLICT when user is already a collaborator", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const target = await seedUser();
      const cb = await seedCookbook(owner.id);
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      await caller.cookbooks.addCollaborator({ cookbookId: cb.id, userId: target.id, role: "viewer" });

      await expect(
        caller.cookbooks.addCollaborator({ cookbookId: cb.id, userId: target.id, role: "editor" })
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });
  });

  it("throws NOT_FOUND when target user does not exist", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const cb = await seedCookbook(owner.id);
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });
      const fakeUserId = "a".repeat(24);

      await expect(
        caller.cookbooks.addCollaborator({ cookbookId: cb.id, userId: fakeUserId, role: "editor" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  it("throws FORBIDDEN when caller is not the owner", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const other = await seedUser();
      const target = await seedUser();
      const cb = await seedCookbook(owner.id);
      const caller = await makeAuthCaller(other.id, { tier: "executive-chef" });

      await expect(
        caller.cookbooks.addCollaborator({ cookbookId: cb.id, userId: target.id, role: "editor" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  it("throws FORBIDDEN when caller is not executive-chef tier", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const target = await seedUser();
      const cb = await seedCookbook(owner.id);
      const caller = await makeAuthCaller(owner.id, { tier: "home-cook" });

      await expect(
        caller.cookbooks.addCollaborator({ cookbookId: cb.id, userId: target.id, role: "editor" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });
});

describe("cookbooks.removeCollaborator", () => {
  it("removes a collaborator and returns { success: true }", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const target = await seedUser();
      const cb = await seedCookbook(owner.id);
      await new Collaborator({ cookbookId: cb._id, userId: target.id, role: "editor", addedBy: owner.id }).save();
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      const result = await caller.cookbooks.removeCollaborator({ cookbookId: cb.id, userId: target.id });

      expect(result).toEqual({ success: true });
      const collab = await Collaborator.findOne({ cookbookId: cb._id, userId: target.id });
      expect(collab).toBeNull();
    });
  });

  it("returns success even when collaborator does not exist", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const target = await seedUser();
      const cb = await seedCookbook(owner.id);
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      const result = await caller.cookbooks.removeCollaborator({ cookbookId: cb.id, userId: target.id });

      expect(result).toEqual({ success: true });
    });
  });

  it("throws FORBIDDEN when caller is not the owner", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const other = await seedUser();
      const target = await seedUser();
      const cb = await seedCookbook(owner.id);
      await new Collaborator({ cookbookId: cb._id, userId: target.id, role: "editor", addedBy: owner.id }).save();
      const caller = await makeAuthCaller(other.id, { tier: "executive-chef" });

      await expect(
        caller.cookbooks.removeCollaborator({ cookbookId: cb.id, userId: target.id })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });
});

describe("cookbooks.myCollaborations", () => {
  it("returns cookbooks the user is collaborating on", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const collab = await seedUser();
      const cb = await new Cookbook({ name: "Shared CB", userId: owner.id, isPublic: false }).save();
      await new Collaborator({ cookbookId: cb._id, userId: collab.id, role: "editor", addedBy: owner.id }).save();
      const caller = await makeAuthCaller(collab.id);

      const result = await caller.cookbooks.myCollaborations();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: cb.id, name: "Shared CB", role: "editor" });
    });
  });

  it("excludes hiddenByTier cookbooks from collaborations", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const collab = await seedUser();
      const cb = await new Cookbook({
        name: "Hidden CB",
        userId: owner.id,
        isPublic: false,
        hiddenByTier: true,
        recipes: [],
      }).save();
      await new Collaborator({ cookbookId: cb._id, userId: collab.id, role: "viewer", addedBy: owner.id }).save();
      const caller = await makeAuthCaller(collab.id);

      const result = await caller.cookbooks.myCollaborations();

      expect(result).toHaveLength(0);
    });
  });

  it("returns empty array when user has no collaborations", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const caller = await makeAuthCaller(user.id);

      const result = await caller.cookbooks.myCollaborations();

      expect(result).toEqual([]);
    });
  });

  it("throws UNAUTHORIZED for unauthenticated caller", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(caller.cookbooks.myCollaborations()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});

describe("cookbooks collaboration notifications triggers", () => {
  it("Test Case 3.1 & 3.2 — Invite Notification & Email Trigger", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const target = await seedUser();
      const cb = await seedCookbook(owner.id);
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      const { sendEmail } = await import("@/lib/mail");
      vi.mocked(sendEmail).mockClear();

      await caller.cookbooks.addCollaborator({
        cookbookId: cb.id,
        userId: target.id,
        role: "editor",
      });

      // Verify in-app notification
      const notification = await Notification.findOne({
        userId: { $eq: target.id },
        senderId: { $eq: owner.id },
        type: { $eq: "collaboration_invited" },
      });
      expect(notification).not.toBeNull();
      expect(notification!.data?.cookbookId?.toString()).toBe(cb.id);
      expect(notification!.data?.cookbookTitle).toBe(cb.name);

      // Verify email was sent
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: target.email,
          subject: expect.stringContaining(cb.name),
        })
      );
    });
  });

  it("Test Case 3.3 — Remove Notification Trigger", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const target = await seedUser();
      const cb = await seedCookbook(owner.id);
      await new Collaborator({ cookbookId: cb._id, userId: target.id, role: "editor", addedBy: owner.id }).save();
      const caller = await makeAuthCaller(owner.id, { tier: "executive-chef" });

      await caller.cookbooks.removeCollaborator({ cookbookId: cb.id, userId: target.id });

      const notification = await Notification.findOne({
        userId: { $eq: target.id },
        senderId: { $eq: owner.id },
        type: { $eq: "collaboration_removed" },
      });
      expect(notification).not.toBeNull();
      expect(notification!.data?.cookbookId?.toString()).toBe(cb.id);
      expect(notification!.data?.cookbookTitle).toBe(cb.name);
    });
  });

  it("Test Case 3.4 & 3.5 — Collaborative Edit vs Owner Edit Recipe Add", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const collaborator = await seedUser();
      const cb = await seedCookbook(owner.id);
      const recipe = await seedRecipe(collaborator.id);

      // Add collaborator
      await new Collaborator({ cookbookId: cb._id, userId: collaborator.id, role: "editor", addedBy: owner.id }).save();

      // Owner edit adds recipe
      const ownerCaller = await makeAuthCaller(owner.id);
      await ownerCaller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: recipe.id });

      // Owner should not get notifications for their own edit
      let notifCount = await Notification.countDocuments({ type: { $eq: "recipe_added" } });
      expect(notifCount).toBe(0);

      // Remove the recipe first so we can add it back as collaborator
      await Cookbook.findByIdAndUpdate(cb.id, { $pull: { recipes: { recipeId: recipe.id } } });

      // Collaborator edit adds recipe
      // We pass collabCookbookIds so they have access to the collaborative cookbook
      const collabCaller = await makeAuthCaller(collaborator.id, { collabCookbookIds: [cb.id] });
      await collabCaller.cookbooks.addRecipe({ cookbookId: cb.id, recipeId: recipe.id });

      // Owner should get a notification
      const notification = await Notification.findOne({
        userId: { $eq: owner.id },
        senderId: { $eq: collaborator.id },
        type: { $eq: "recipe_added" },
      });
      expect(notification).not.toBeNull();
      expect(notification!.data?.cookbookId?.toString()).toBe(cb.id);
      expect(notification!.data?.recipeId?.toString()).toBe(recipe.id);
      expect(notification!.data?.recipeTitle).toBe(recipe.name);
    });
  });

  it("Collaborative Recipe Remove Trigger", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const collaborator = await seedUser();
      const cb = await seedCookbook(owner.id);
      const recipe = await seedRecipe(collaborator.id);

      // Add collaborator and add recipe to cookbook
      await new Collaborator({ cookbookId: cb._id, userId: collaborator.id, role: "editor", addedBy: owner.id }).save();
      await Cookbook.findByIdAndUpdate(cb.id, { $push: { recipes: { recipeId: recipe.id, orderIndex: 0 } } });

      // Collaborator removes recipe
      const collabCaller = await makeAuthCaller(collaborator.id, { collabCookbookIds: [cb.id] });
      await collabCaller.cookbooks.removeRecipe({ cookbookId: cb.id, recipeId: recipe.id });

      // Owner should get a notification
      const notification = await Notification.findOne({
        userId: { $eq: owner.id },
        senderId: { $eq: collaborator.id },
        type: { $eq: "recipe_removed" },
      });
      expect(notification).not.toBeNull();
      expect(notification!.data?.cookbookId?.toString()).toBe(cb.id);
      expect(notification!.data?.recipeId?.toString()).toBe(recipe.id);
      expect(notification!.data?.recipeTitle).toBe(recipe.name);
    });
  });

  describe("cookbooks.onboardCollaborator and byId status", () => {
    async function setupCollaborator(onboarded = false) {
      const owner = await seedUser();
      const collaborator = await seedUser();
      const cb = await seedCookbook(owner.id);
      await new Collaborator({
        cookbookId: cb._id,
        userId: collaborator.id,
        role: "editor",
        addedBy: owner.id,
        onboarded,
      }).save();
      return { owner, collaborator, cb };
    }

    it("exposes onboarded status in byId query", async () => {
      await withCleanDb(async () => {
        const { collaborator, cb } = await setupCollaborator(false);

        const caller = await makeAuthCaller(collaborator.id, { collabCookbookIds: [cb.id] });
        const details = await caller.cookbooks.byId({ id: cb.id });

        expect(details).not.toBeNull();
        expect(details!.collaborators).toHaveLength(1);
        expect(details!.collaborators[0].onboarded).toBe(false);
      });
    });

    it("defaults missing/undefined onboarded status to true for pre-existing records in byId query", async () => {
      await withCleanDb(async () => {
        const owner = await seedUser();
        const collaborator = await seedUser();
        const cb = await seedCookbook(owner.id);

        // Seed a collaborator without the onboarded field (using MongoDB collection directly)
        const mongo = Collaborator.collection;
        await mongo.insertOne({
          cookbookId: cb._id,
          userId: new Types.ObjectId(collaborator.id),
          role: "editor",
          addedBy: new Types.ObjectId(owner.id),
          addedAt: new Date(),
        });

        const caller = await makeAuthCaller(collaborator.id, { collabCookbookIds: [cb.id] });
        const details = await caller.cookbooks.byId({ id: cb.id });

        expect(details).not.toBeNull();
        expect(details!.collaborators).toHaveLength(1);
        expect(details!.collaborators[0].onboarded).toBe(true);
      });
    });

    it("updates onboarded status to true on onboardCollaborator mutation", async () => {
      await withCleanDb(async () => {
        const { collaborator, cb } = await setupCollaborator(false);

        const caller = await makeAuthCaller(collaborator.id, { collabCookbookIds: [cb.id] });
        const result = await caller.cookbooks.onboardCollaborator({ cookbookId: cb.id });

        expect(result).toEqual({ success: true });

        const updated = await Collaborator.findOne({
          cookbookId: { $eq: new Types.ObjectId(cb._id) },
          userId: { $eq: new Types.ObjectId(collaborator.id) },
        });
        expect(updated).not.toBeNull();
        expect(updated!.onboarded).toBe(true);
      });
    });

    it("throws FORBIDDEN when user is not a collaborator on the cookbook", async () => {
      await withCleanDb(async () => {
        const owner = await seedUser();
        const other = await seedUser();
        const cb = await seedCookbook(owner.id);

        // other is not a collaborator
        const caller = await makeAuthCaller(other.id);
        await expect(
          caller.cookbooks.onboardCollaborator({ cookbookId: cb.id })
        ).rejects.toMatchObject({ code: "FORBIDDEN" });
      });
    });

    it("is idempotent when the collaborator is already onboarded", async () => {
      await withCleanDb(async () => {
        const { collaborator, cb } = await setupCollaborator(true);

        const caller = await makeAuthCaller(collaborator.id, { collabCookbookIds: [cb.id] });
        const result = await caller.cookbooks.onboardCollaborator({ cookbookId: cb.id });

        expect(result).toEqual({ success: true });

        const updated = await Collaborator.findOne({
          cookbookId: { $eq: new Types.ObjectId(cb._id) },
          userId: { $eq: new Types.ObjectId(collaborator.id) },
        });
        expect(updated).not.toBeNull();
        expect(updated!.onboarded).toBe(true);
      });
    });
  });
});

describe("cookbooks - personalSourceName stripping", () => {
  it("TC-5 (cookbooks.byId): strips personalSourceName from recipe stubs if the viewer is not the recipe owner", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const other = await seedUser();
      const personalSource = await new Source({ name: "Personal", slug: "personal" }).save();

      // Cookbooks owner is `owner`
      const cb = await seedCookbook(owner.id);

      // Recipe 1 owned by owner
      const r1 = await new Recipe({
        name: `Recipe-1-${uid()}`,
        userId: owner.id,
        isPublic: true,
        sourceId: personalSource.id,
        personalSourceName: "Owner Recipe Source",
      }).save();

      // Recipe 2 owned by other
      const r2 = await new Recipe({
        name: `Recipe-2-${uid()}`,
        userId: other.id,
        isPublic: true,
        sourceId: personalSource.id,
        personalSourceName: "Other Recipe Source",
      }).save();

      await seedCookbookWithRecipes(cb.id, r1.id, r2.id);

      // Viewer is `owner` (matches recipe 1 owner but not recipe 2)
      const ownerCaller = await makeAuthCaller(owner.id);
      const ownerResult = await ownerCaller.cookbooks.byId({ id: cb.id });
      expect(ownerResult).not.toBeNull();
      const ownerRecipes = ownerResult!.recipes;

      const r1AsOwner = ownerRecipes.find((r) => r.id === r1.id);
      const r2AsVisitor = ownerRecipes.find((r) => r.id === r2.id);

      expect(r1AsOwner?.personalSourceName).toBe("Owner Recipe Source");
      expect(r2AsVisitor).toBeDefined();
      expect("personalSourceName" in r2AsVisitor!).toBe(false);

      // Viewer is anonymous (matches neither recipe owner)
      const anonCaller = await makeAnonCaller();
      const anonResult = await anonCaller.cookbooks.byId({ id: cb.id });
      expect(anonResult).not.toBeNull();
      anonResult!.recipes.forEach((r) => {
        expect("personalSourceName" in r).toBe(false);
      });
    });
  });
});

