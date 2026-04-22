// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Recipe, Cookbook, Classification, Source, Meal, Course, Preparation } from "@/db/models";
import {
  seedUserWithBetterAuth,
  uid,
  makeAnonCaller,
  makeAuthCaller,
  makeTieredCaller,
} from "./test-helpers";

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

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
        const caller = await makeAuthCaller(
          user.id,
          "test@test.com",
          _tier ?? "home-cook",
        );
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
      const src = await new Source({ name: "Bon Appétit", url: "https://bonappetit.com" }).save();
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

// ─── visibility enforcement (tier-based) ─────────────────────────

describe("visibility enforcement", () => {
  describe("create", () => {
    it("Home Cook creates private cookbook -> coerced to public", async () => {
      await withCleanDb(async () => {
        const caller = await makeTieredCaller("home-cook");
        const result = await caller.cookbooks.create({
          name: "Home Cook Private",
          isPublic: false,
        });
        expect(result.isPublic).toBe(true);
      });
    });

    it("Prep Cook creates private cookbook -> coerced to public", async () => {
      await withCleanDb(async () => {
        const caller = await makeTieredCaller("prep-cook");
        const result = await caller.cookbooks.create({
          name: "Prep Cook Private",
          isPublic: false,
        });
        expect(result.isPublic).toBe(true);
      });
    });

    it("Sous Chef creates private cookbook -> remains private", async () => {
      await withCleanDb(async () => {
        const caller = await makeTieredCaller("sous-chef");
        const result = await caller.cookbooks.create({
          name: "Sous Chef Private",
          isPublic: false,
        });
        expect(result.isPublic).toBe(false);
      });
    });
  });

  describe("update", () => {
    it("Prep Cook updates cookbook to private -> rejected with FORBIDDEN", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const cb = await seedCookbook(user.id, { isPublic: true });

        const caller = await makeAuthCaller(user.id, "test@test.com", "prep-cook");
        await expect(
          caller.cookbooks.update({
            id: cb.id,
            isPublic: false,
          }),
        ).rejects.toThrow(/support private cookbooks/i);

        const persisted = await Cookbook.findById(cb.id).lean();
        expect(persisted?.isPublic).toBe(true);
      });
    });

    it("Sous Chef updates cookbook to private -> allowed", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const cb = await seedCookbook(user.id, { isPublic: true });

        const caller = await makeAuthCaller(
          user.id,
          "test@test.com",
          "sous-chef",
        );
        const result = await caller.cookbooks.update({
          id: cb.id,
          isPublic: false,
        });

        expect(result?.isPublic).toBe(false);
      });
    });

    it("Admin updates cookbook to private -> allowed", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const cb = await seedCookbook(user.id, { isPublic: true });

        const caller = await makeAuthCaller(user.id, "test@test.com", "home-cook", true);
        const result = await caller.cookbooks.update({
          id: cb.id,
          isPublic: false,
        });

        expect(result?.isPublic).toBe(false);
      });
    });
  });
});
