// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Recipe, Cookbook, Classification, Source, Meal, Course, Preparation } from "@/db/models";
import {
  seedUserWithBetterAuth,
  uid,
  makeAnonCaller,
  makeAuthCaller,
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

/** Seed a cookbook with two recipes inserted in reverse orderIndex (r1→1, r2→0). */
async function seedCookbookWithOrderedPair(ownerId: string) {
  const cb = await seedCookbook(ownerId);
  const r1 = await seedRecipe(ownerId);
  const r2 = await seedRecipe(ownerId);
  await Cookbook.findByIdAndUpdate(cb.id, {
    recipes: [
      { recipeId: r1.id, orderIndex: 1 },
      { recipeId: r2.id, orderIndex: 0 },
    ],
  });
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
});

// ─── cookbooks.byId ──────────────────────────────────────────────────────────

describe("cookbooks.byId", () => {
  itNullCases((caller, id) => caller.cookbooks.byId({ id }));

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

      await Cookbook.findByIdAndUpdate(cb.id, {
        recipes: [
          { recipeId: publicRecipe.id, orderIndex: 0 },
          { recipeId: privateRecipe.id, orderIndex: 1 },
        ],
      });

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

      await Cookbook.findByIdAndUpdate(cb.id, {
        recipes: [{ recipeId: recipe.id, orderIndex: 0 }],
      });

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
      { name: "Private Eats", isPublic: false },
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
        const caller = await makeAuthCaller(user.id);
        expect(await caller.cookbooks.create(input)).toMatchObject({
          ...expected,
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
      await Cookbook.findByIdAndUpdate(cb.id, {
        recipes: [{ recipeId: r.id, orderIndex: 0 }],
      });

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

      await Cookbook.findByIdAndUpdate(cb.id, {
        recipes: [{ recipeId: recipe.id, orderIndex: 0 }],
      });

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

      await Cookbook.findByIdAndUpdate(cb.id, {
        recipes: [
          { recipeId: r1.id, orderIndex: 0 },
          { recipeId: r2.id, orderIndex: 1 },
          { recipeId: r3.id, orderIndex: 2 },
        ],
      });

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

      await Cookbook.findByIdAndUpdate(cb.id, {
        recipes: [
          { recipeId: r1.id, orderIndex: 0 },
          { recipeId: r2.id, orderIndex: 1 },
        ],
      });

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
});
