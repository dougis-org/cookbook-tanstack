// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import {
  Recipe,
  Meal,
  Course,
  Preparation,
  Classification,
  Source,
  RecipeLike,
  Cookbook,
} from "@/db/models";
import { seedUserWithBetterAuth } from "./test-helpers";

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

// A valid 24-hex-char ObjectId string that will not match any document
const VALID_OBJECT_ID = "000000000000000000000000";

const RUN_ID = Date.now();
let seq = 0;
function uid() {
  return `${RUN_ID}-${++seq}`;
}

const seedUser = seedUserWithBetterAuth;

async function makeAnonCaller() {
  const { appRouter } = await import("@/server/trpc/router");
  return appRouter.createCaller({ session: null, user: null });
}

async function makeAuthCaller(userId: string) {
  const { appRouter } = await import("@/server/trpc/router");
  return appRouter.createCaller({
    session: { id: "s1" } as never,
    user: { id: userId } as never,
  });
}

// ─── recipes.list — visibility filtering ─────────────────────────────────────

describe("recipes.list", () => {
  describe("visibility filtering", () => {
    it("anon user sees a public recipe but not a private recipe from the same owner", async () => {
      await withCleanDb(async () => {
        const owner = await seedUser();
        await new Recipe({
          name: "Public One",
          userId: owner.id,
          isPublic: true,
        }).save();
        await new Recipe({
          name: "Private One",
          userId: owner.id,
          isPublic: false,
        }).save();

        const caller = await makeAnonCaller();
        const result = await caller.recipes.list({ userId: owner.id });

        expect(result.items).toHaveLength(1);
        expect(result.items[0]).toMatchObject({ name: "Public One" });
      });
    });

    it("authenticated owner sees their own private recipe", async () => {
      await withCleanDb(async () => {
        const owner = await seedUser();
        await new Recipe({
          name: "My Private",
          userId: owner.id,
          isPublic: false,
        }).save();

        const caller = await makeAuthCaller(owner.id);
        const result = await caller.recipes.list({ userId: owner.id });

        expect(result.items).toHaveLength(1);
        expect(result.items[0]).toMatchObject({ name: "My Private" });
      });
    });

    it("anon user sees nothing when scoped to an owner who has only private recipes", async () => {
      await withCleanDb(async () => {
        const owner = await seedUser();
        await new Recipe({
          name: "Hidden",
          userId: owner.id,
          isPublic: false,
        }).save();

        const caller = await makeAnonCaller();
        const result = await caller.recipes.list({ userId: owner.id });

        expect(result.items).toEqual([]);
      });
    });

    it("another authenticated user cannot see a private recipe through userId scoping", async () => {
      await withCleanDb(async () => {
        const secretOwner = await seedUser();
        const viewer = await seedUser();
        await new Recipe({
          name: "Top Secret",
          userId: secretOwner.id,
          isPublic: false,
        }).save();

        const caller = await makeAuthCaller(viewer.id);
        const result = await caller.recipes.list({ userId: secretOwner.id });

        expect(result.items).toEqual([]);
      });
    });

    it("pagination metadata reflects scoped result count", async () => {
      await withCleanDb(async () => {
        const owner = await seedUser();
        const caller = await makeAnonCaller();
        const result = await caller.recipes.list({
          userId: owner.id,
          page: 2,
          pageSize: 5,
        });

        expect(result.page).toBe(2);
        expect(result.pageSize).toBe(5);
        expect(result.total).toBe(0);
        expect(result.items).toEqual([]);
      });
    });
  });

  describe("search", () => {
    it("filters by name using case-insensitive partial match within a user's recipes", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        await new Recipe({
          name: "Pasta Carbonara",
          userId: user.id,
          isPublic: true,
        }).save();
        await new Recipe({
          name: "Beef Stew",
          userId: user.id,
          isPublic: true,
        }).save();

        const caller = await makeAnonCaller();
        const result = await caller.recipes.list({
          userId: user.id,
          search: "pasta",
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0]).toMatchObject({ name: "Pasta Carbonara" });
      });
    });

    it("filters by ingredients text (>= 2 chars) within a user's recipes", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        await new Recipe({
          name: "Soup",
          userId: user.id,
          isPublic: true,
          ingredients: "chicken broth\nnoodles",
        }).save();
        await new Recipe({
          name: "Salad",
          userId: user.id,
          isPublic: true,
          ingredients: "lettuce\ntomato",
        }).save();

        const caller = await makeAnonCaller();
        const result = await caller.recipes.list({
          userId: user.id,
          search: "chicken",
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0]).toMatchObject({ name: "Soup" });
      });
    });

    it("whitespace-only search returns all visible recipes without applying any filter", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        await new Recipe({
          name: "Recipe A",
          userId: user.id,
          isPublic: true,
        }).save();
        await new Recipe({
          name: "Recipe B",
          userId: user.id,
          isPublic: true,
        }).save();

        const caller = await makeAnonCaller();
        const result = await caller.recipes.list({
          userId: user.id,
          search: "   ",
        });

        expect(result.items).toHaveLength(2);
      });
    });
  });

  describe("filter parameters", () => {
    it("filters by mealId — returns only recipes linked to that meal", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const id = uid();
        const meal = await new Meal({
          name: "Dinner",
          slug: `dinner-${id}`,
        }).save();
        const recipeWithMeal = await new Recipe({
          name: "Steak",
          userId: user.id,
          isPublic: true,
          mealIds: [meal.id],
        }).save();
        await new Recipe({
          name: "Salad",
          userId: user.id,
          isPublic: true,
        }).save();

        const caller = await makeAnonCaller();
        const result = await caller.recipes.list({
          userId: user.id,
          mealIds: [meal.id],
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0]).toMatchObject({ name: "Steak" });
        void recipeWithMeal;
      });
    });

    it.each([
      ["courseIds", { courseIds: [VALID_OBJECT_ID] }],
      ["preparationIds", { preparationIds: [VALID_OBJECT_ID] }],
      ["classificationIds", { classificationIds: [VALID_OBJECT_ID] }],
      ["sourceIds", { sourceIds: [VALID_OBJECT_ID] }],
      ["sort", { sort: "name_asc" as const }],
    ])("accepts %s filter without error", async (_, input) => {
      await withCleanDb(async () => {
        const caller = await makeAnonCaller();
        expect(await caller.recipes.list(input)).toHaveProperty("items");
      });
    });

    it("filters by classificationIds — returns only recipes linked to any of those classifications", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const id = uid();
        const clsA = await new Classification({ name: "Italian", slug: `italian-${id}` }).save();
        const clsB = await new Classification({ name: "Mexican", slug: `mexican-${id}` }).save();
        await new Recipe({ name: "Pasta", userId: user.id, isPublic: true, classificationId: clsA.id }).save();
        await new Recipe({ name: "Tacos", userId: user.id, isPublic: true, classificationId: clsB.id }).save();
        await new Recipe({ name: "Plain", userId: user.id, isPublic: true }).save();

        const caller = await makeAnonCaller();

        // Single classification
        const single = await caller.recipes.list({ userId: user.id, classificationIds: [clsA.id] });
        expect(single.items).toHaveLength(1);
        expect(single.items[0]).toMatchObject({ name: "Pasta" });

        // Multiple classifications — OR semantics via $in
        const multi = await caller.recipes.list({ userId: user.id, classificationIds: [clsA.id, clsB.id] });
        expect(multi.items).toHaveLength(2);
        expect(multi.items.map((r) => r.name)).toEqual(expect.arrayContaining(["Pasta", "Tacos"]));
      });
    });

    it("filters by sourceIds — returns only recipes linked to any of those sources", async () => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const srcA = await new Source({ name: "Bon Appétit", url: "https://bonappetit.com" }).save();
        const srcB = await new Source({ name: "NYT Cooking", url: "https://cooking.nytimes.com" }).save();
        await new Recipe({ name: "Fancy Salad", userId: user.id, isPublic: true, sourceId: srcA.id }).save();
        await new Recipe({ name: "NYC Bagel", userId: user.id, isPublic: true, sourceId: srcB.id }).save();
        await new Recipe({ name: "Mystery Recipe", userId: user.id, isPublic: true }).save();

        const caller = await makeAnonCaller();

        // Multiple sources — OR semantics
        const result = await caller.recipes.list({ userId: user.id, sourceIds: [srcA.id, srcB.id] });
        expect(result.items).toHaveLength(2);
        expect(result.items.map((r) => r.name)).toEqual(expect.arrayContaining(["Fancy Salad", "NYC Bagel"]));
      });
    });
  });
});

// ─── recipes.list — classificationName ───────────────────────────────────────

describe("recipes.list — classificationName", () => {
  it("includes classificationName when recipe has a linked classification", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const id = uid();
      const cls = await new Classification({
        name: "Italian",
        slug: `italian-${id}`,
      }).save();
      await new Recipe({
        name: "Pasta",
        userId: user.id,
        isPublic: true,
        classificationId: cls.id,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({ userId: user.id });

      expect(result.items[0]).toMatchObject({ classificationName: "Italian" });
    });
  });

  it("returns classificationName as null when recipe has no classification", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      await new Recipe({
        name: "Plain Recipe",
        userId: user.id,
        isPublic: true,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({ userId: user.id });

      expect(result.items[0]).toMatchObject({ classificationName: null });
    });
  });
});

// ─── recipes.byId ─────────────────────────────────────────────────────────────

describe("recipes.byId", () => {
  it("returns null when recipe does not exist", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      expect(await caller.recipes.byId({ id: VALID_OBJECT_ID })).toBeNull();
    });
  });

  it("returns null for a non-existent id string (any string accepted)", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      // byId now accepts any string — non-existent id returns null
      expect(await caller.recipes.byId({ id: VALID_OBJECT_ID })).toBeNull();
    });
  });

  it("returns a public recipe when found", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Found Recipe",
        userId: user.id,
        isPublic: true,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.byId({ id: recipe.id });

      expect(result).toMatchObject({ id: recipe.id, name: "Found Recipe" });
    });
  });

  it.each([
    {
      label: "meals",
      link: async (recipeId: string) => {
        const id = uid();
        const m = await new Meal({
          name: "Breakfast",
          slug: `bfast-${id}`,
        }).save();
        await Recipe.findByIdAndUpdate(recipeId, {
          $addToSet: { mealIds: m.id },
        });
        return m;
      },
      resultKey: "meals" as const,
    },
    {
      label: "courses",
      link: async (recipeId: string) => {
        const id = uid();
        const c = await new Course({
          name: "Entree",
          slug: `entree-${id}`,
        }).save();
        await Recipe.findByIdAndUpdate(recipeId, {
          $addToSet: { courseIds: c.id },
        });
        return c;
      },
      resultKey: "courses" as const,
    },
    {
      label: "preparations",
      link: async (recipeId: string) => {
        const id = uid();
        const p = await new Preparation({
          name: "Bake",
          slug: `bake-${id}`,
        }).save();
        await Recipe.findByIdAndUpdate(recipeId, {
          $addToSet: { preparationIds: p.id },
        });
        return p;
      },
      resultKey: "preparations" as const,
    },
  ])(
    "returns $label names when recipe has linked $label",
    async ({ link, resultKey }) => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const recipe = await new Recipe({
          name: "Dish",
          userId: user.id,
          isPublic: true,
        }).save();
        const entity = await link(recipe.id);
        const result = await (
          await makeAnonCaller()
        ).recipes.byId({ id: recipe.id });
        expect(result?.[resultKey]).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: entity.id, name: entity.name }),
          ]),
        );
      });
    },
  );

  it.each([
    {
      label: "classificationName",
      seed: async () => {
        const id = uid();
        const cls = await new Classification({
          name: "Italian",
          slug: `italian-${id}`,
        }).save();
        return {
          recipeExtra: { classificationId: cls.id },
          expected: { classificationName: "Italian" },
        };
      },
    },
    {
      label: "sourceName and sourceUrl",
      seed: async () => {
        const src = await new Source({
          name: "Bon Appétit",
          url: "https://bonappetit.com",
        }).save();
        return {
          recipeExtra: { sourceId: src.id },
          expected: {
            sourceName: "Bon Appétit",
            sourceUrl: "https://bonappetit.com",
          },
        };
      },
    },
  ])("includes $label when recipe has a linked entity", async ({ seed }) => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const { recipeExtra, expected } = await seed();
      const recipe = await new Recipe({
        name: "Dish",
        userId: user.id,
        isPublic: true,
        ...recipeExtra,
      }).save();
      expect(
        await (await makeAnonCaller()).recipes.byId({ id: recipe.id }),
      ).toMatchObject(expected);
    });
  });

  it.each([["classificationName"], ["sourceName"]])(
    "returns %s as null when recipe has no linked entity",
    async (field) => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const recipe = await new Recipe({
          name: "Plain",
          userId: user.id,
          isPublic: true,
        }).save();
        expect(
          await (await makeAnonCaller()).recipes.byId({ id: recipe.id }),
        ).toMatchObject({ [field]: null });
      });
    },
  );
});

// ─── recipes.create ───────────────────────────────────────────────────────────

describe("recipes.create", () => {
  it("rejects unauthenticated requests", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(caller.recipes.create({ name: "Test" })).rejects.toThrow(
        "UNAUTHORIZED",
      );
    });
  });

  it("rejects an empty name", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const caller = await makeAuthCaller(user.id);
      await expect(caller.recipes.create({ name: "" })).rejects.toThrow();
    });
  });

  it("creates a recipe and returns the new record", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const caller = await makeAuthCaller(user.id);
      const result = await caller.recipes.create({ name: "My New Recipe" });
      expect(result).toMatchObject({ name: "My New Recipe", userId: user.id });
    });
  });
});

// ─── recipes.update ───────────────────────────────────────────────────────────

describe("recipes.update", () => {
  it("rejects unauthenticated requests", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(
        caller.recipes.update({ id: VALID_OBJECT_ID, name: "Updated" }),
      ).rejects.toThrow("UNAUTHORIZED");
    });
  });

  it("updates the recipe name", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Old Name",
        userId: user.id,
      }).save();

      const caller = await makeAuthCaller(user.id);
      const result = await caller.recipes.update({
        id: recipe.id,
        name: "New Name",
      });
      expect(result).toMatchObject({ name: "New Name" });
    });
  });

  it("returns current record unchanged when only taxonomy IDs are updated", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const id = uid();
      const recipe = await new Recipe({
        name: "Existing",
        userId: user.id,
      }).save();
      const meal = await new Meal({
        name: "Breakfast",
        slug: `bfast-${id}`,
      }).save();

      const caller = await makeAuthCaller(user.id);
      const result = await caller.recipes.update({
        id: recipe.id,
        mealIds: [meal.id],
      });

      expect(result).toMatchObject({ id: recipe.id, name: "Existing" });
    });
  });
});

// ─── recipes.delete ───────────────────────────────────────────────────────────

describe("recipes.delete", () => {
  it("rejects unauthenticated requests", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(
        caller.recipes.delete({ id: VALID_OBJECT_ID }),
      ).rejects.toThrow("UNAUTHORIZED");
    });
  });

  it("deletes the recipe and makes it no longer retrievable", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Delete Me",
        userId: user.id,
        isPublic: true,
      }).save();

      const caller = await makeAuthCaller(user.id);
      const result = await caller.recipes.delete({ id: recipe.id });

      expect(result).toEqual({ success: true });
      expect(await caller.recipes.byId({ id: recipe.id })).toBeNull();
    });
  });

  it("removes the recipe from any cookbook's recipes array", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Cascaded Recipe",
        userId: user.id,
        isPublic: true,
      }).save();
      const cookbook = await new Cookbook({
        name: "My Cookbook",
        userId: user.id,
        recipes: [{ recipeId: recipe.id, orderIndex: 0 }],
      }).save();

      const caller = await makeAuthCaller(user.id);
      await caller.recipes.delete({ id: recipe.id });

      const updated = await Cookbook.findById(cookbook.id).lean();
      expect(updated?.recipes).toHaveLength(0);
    });
  });

  it("removes all RecipeLike documents for the recipe", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Liked Recipe",
        userId: user.id,
        isPublic: true,
      }).save();
      await new RecipeLike({ userId: user.id, recipeId: recipe.id }).save();

      const caller = await makeAuthCaller(user.id);
      await caller.recipes.delete({ id: recipe.id });

      const remaining = await RecipeLike.countDocuments({ recipeId: recipe.id });
      expect(remaining).toBe(0);
    });
  });

  it("cleans up both cookbook entries and likes in a single delete", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Full Cascade",
        userId: user.id,
        isPublic: true,
      }).save();
      const cookbook = await new Cookbook({
        name: "Cascade Cookbook",
        userId: user.id,
        recipes: [{ recipeId: recipe.id, orderIndex: 0 }],
      }).save();
      await new RecipeLike({ userId: user.id, recipeId: recipe.id }).save();

      const caller = await makeAuthCaller(user.id);
      const result = await caller.recipes.delete({ id: recipe.id });

      expect(result).toEqual({ success: true });

      const updated = await Cookbook.findById(cookbook.id).lean();
      expect(updated?.recipes).toHaveLength(0);

      const likes = await RecipeLike.countDocuments({ recipeId: recipe.id });
      expect(likes).toBe(0);
    });
  });

  it("succeeds when the recipe has no cookbook or like references", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Orphan Recipe",
        userId: user.id,
        isPublic: true,
      }).save();

      const caller = await makeAuthCaller(user.id);
      const result = await caller.recipes.delete({ id: recipe.id });

      expect(result).toEqual({ success: true });
    });
  });
});

// ─── recipes.delete — soft delete ────────────────────────────────────────────

describe("delete — soft delete", () => {
  it("recipe document remains in the collection with deleted: true after delete", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Soft Delete Me",
        userId: user.id,
        isPublic: true,
      }).save();

      const caller = await makeAuthCaller(user.id);
      await caller.recipes.delete({ id: recipe.id });

      // Bypass pre-find middleware by querying directly via the native driver
      const raw = await Recipe.collection.findOne({ _id: recipe._id });
      expect(raw).not.toBeNull();
      expect(raw?.deleted).toBe(true);
    });
  });

  it("deleted recipe is NOT returned by recipes.list", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Hidden Recipe",
        userId: user.id,
        isPublic: true,
      }).save();

      const caller = await makeAuthCaller(user.id);
      await caller.recipes.delete({ id: recipe.id });

      const result = await caller.recipes.list({ userId: user.id });
      expect(result.items.map((r) => r.id)).not.toContain(recipe.id);
    });
  });

  it("deleted recipe is NOT returned by recipes.byId", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Gone Recipe",
        userId: user.id,
        isPublic: true,
      }).save();

      const caller = await makeAuthCaller(user.id);
      await caller.recipes.delete({ id: recipe.id });

      const result = await caller.recipes.byId({ id: recipe.id });
      expect(result).toBeNull();
    });
  });

  it("cookbook entries for the deleted recipe are still removed", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Cookbook Recipe",
        userId: user.id,
        isPublic: true,
      }).save();
      const cookbook = await new Cookbook({
        name: "Test Cookbook",
        userId: user.id,
        recipes: [{ recipeId: recipe.id, orderIndex: 0 }],
      }).save();

      const caller = await makeAuthCaller(user.id);
      await caller.recipes.delete({ id: recipe.id });

      const updated = await Cookbook.findById(cookbook.id).lean();
      expect(updated?.recipes).toHaveLength(0);
    });
  });

  it("RecipeLike documents for the deleted recipe are still removed", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Liked Recipe SD",
        userId: user.id,
        isPublic: true,
      }).save();
      await new RecipeLike({ userId: user.id, recipeId: recipe.id }).save();

      const caller = await makeAuthCaller(user.id);
      await caller.recipes.delete({ id: recipe.id });

      const remaining = await RecipeLike.countDocuments({ recipeId: recipe.id });
      expect(remaining).toBe(0);
    });
  });

  it("recipe without the deleted field is still returned by list and byId (backward compat)", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      // Insert directly via native driver to simulate a pre-migration document
      const result = await Recipe.collection.insertOne({
        name: "Legacy Recipe",
        userId: new Types.ObjectId(user.id),
        isPublic: true,
        mealIds: [],
        courseIds: [],
        preparationIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const legacyId = result.insertedId.toString();

      const caller = await makeAnonCaller();

      const listResult = await caller.recipes.list({ userId: user.id });
      expect(listResult.items.map((r) => r.id)).toContain(legacyId);

      const byIdResult = await caller.recipes.byId({ id: legacyId });
      expect(byIdResult).not.toBeNull();
      expect(byIdResult?.name).toBe("Legacy Recipe");
    });
  });
});

// ─── recipes.list — hasImage filter ───────────────────────────────────────────

describe("recipes.list — hasImage filter", () => {
  it("returns only recipes with an imageUrl when hasImage is true", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      await new Recipe({
        name: "With Image",
        userId: user.id,
        isPublic: true,
        imageUrl: "https://example.com/img.jpg",
      }).save();
      await new Recipe({
        name: "No Image",
        userId: user.id,
        isPublic: true,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({
        userId: user.id,
        hasImage: true,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ name: "With Image" });
    });
  });

  it("returns all visible recipes when hasImage is not set", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      await new Recipe({
        name: "With Image",
        userId: user.id,
        isPublic: true,
        imageUrl: "https://example.com/img.jpg",
      }).save();
      await new Recipe({
        name: "No Image",
        userId: user.id,
        isPublic: true,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({ userId: user.id });

      expect(result.items).toHaveLength(2);
    });
  });
});

// ─── recipes.list — servings range filter ─────────────────────────────────────

describe("recipes.list — servings range filter", () => {
  it("minServings returns only recipes with servings >= min", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      await new Recipe({
        name: "Small Batch",
        userId: user.id,
        isPublic: true,
        servings: 2,
      }).save();
      await new Recipe({
        name: "Large Batch",
        userId: user.id,
        isPublic: true,
        servings: 8,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({
        userId: user.id,
        minServings: 5,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ name: "Large Batch" });
    });
  });

  it("maxServings returns only recipes with servings <= max", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      await new Recipe({
        name: "Small Batch",
        userId: user.id,
        isPublic: true,
        servings: 2,
      }).save();
      await new Recipe({
        name: "Large Batch",
        userId: user.id,
        isPublic: true,
        servings: 8,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({
        userId: user.id,
        maxServings: 4,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ name: "Small Batch" });
    });
  });

  it("minServings + maxServings returns recipes within the inclusive range", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      await new Recipe({
        name: "Tiny",
        userId: user.id,
        isPublic: true,
        servings: 1,
      }).save();
      await new Recipe({
        name: "Medium",
        userId: user.id,
        isPublic: true,
        servings: 4,
      }).save();
      await new Recipe({
        name: "Huge",
        userId: user.id,
        isPublic: true,
        servings: 20,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({
        userId: user.id,
        minServings: 2,
        maxServings: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ name: "Medium" });
    });
  });

  it("excludes recipes with null servings from a minServings query", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      await new Recipe({
        name: "Unknown Servings",
        userId: user.id,
        isPublic: true,
      }).save();
      await new Recipe({
        name: "Known Servings",
        userId: user.id,
        isPublic: true,
        servings: 4,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({
        userId: user.id,
        minServings: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ name: "Known Servings" });
    });
  });
});

// ─── recipes.list — new sort options ──────────────────────────────────────────

describe("recipes.list — new sort options", () => {
  it.each([
    ["servings_asc" as const],
    ["servings_desc" as const],
    ["updated_desc" as const],
  ])("sort=%s returns results without error", async (sort) => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({ sort });
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
    });
  });

  it("servings_asc orders by servings ascending", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      await new Recipe({
        name: "Eight Servings",
        userId: user.id,
        isPublic: true,
        servings: 8,
      }).save();
      await new Recipe({
        name: "Two Servings",
        userId: user.id,
        isPublic: true,
        servings: 2,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({
        userId: user.id,
        sort: "servings_asc",
      });

      const names = result.items.map((r) => r.name);
      expect(names.indexOf("Two Servings")).toBeLessThan(
        names.indexOf("Eight Servings"),
      );
    });
  });

  it("servings_desc orders by servings descending", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      await new Recipe({
        name: "Two Servings",
        userId: user.id,
        isPublic: true,
        servings: 2,
      }).save();
      await new Recipe({
        name: "Eight Servings",
        userId: user.id,
        isPublic: true,
        servings: 8,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({
        userId: user.id,
        sort: "servings_desc",
      });

      const names = result.items.map((r) => r.name);
      expect(names.indexOf("Eight Servings")).toBeLessThan(
        names.indexOf("Two Servings"),
      );
    });
  });

  it("updated_desc orders by updatedAt descending", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const r1 = await new Recipe({
        name: "Old Recipe",
        userId: user.id,
        isPublic: true,
        updatedAt: new Date("2020-01-01"),
      }).save();
      await new Recipe({
        name: "New Recipe",
        userId: user.id,
        isPublic: true,
      }).save();

      // Touch r1 to bump its updatedAt past New Recipe's timestamp
      await Recipe.findByIdAndUpdate(r1.id, { name: "Old Recipe — Touched" });

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({
        userId: user.id,
        sort: "updated_desc",
      });

      const names = result.items.map((r) => r.name);
      expect(names[0]).toBe("Old Recipe — Touched");
    });
  });
});

// ─── recipes.list — markedByMe filter ────────────────────────────────────────

describe("recipes.list — markedByMe filter", () => {
  it("returns only the recipe the caller has favorited", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const viewer = await seedUser();
      const liked = await new Recipe({
        name: "Liked Recipe",
        userId: owner.id,
        isPublic: true,
      }).save();
      await new Recipe({
        name: "Ignored Recipe",
        userId: owner.id,
        isPublic: true,
      }).save();
      await new RecipeLike({ userId: viewer.id, recipeId: liked.id }).save();

      const caller = await makeAuthCaller(viewer.id);
      const result = await caller.recipes.list({ markedByMe: true });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ name: "Liked Recipe" });
    });
  });

  it("returns empty when the caller has no favorites", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const viewer = await seedUser();
      await new Recipe({
        name: "Public Recipe",
        userId: owner.id,
        isPublic: true,
      }).save();

      const caller = await makeAuthCaller(viewer.id);
      const result = await caller.recipes.list({ markedByMe: true });

      expect(result.items).toEqual([]);
    });
  });

  it("treats markedByMe as a no-op for anonymous callers and returns visible recipes", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const liker = await seedUser();
      const publicRecipe = await new Recipe({
        name: "Public Recipe",
        userId: owner.id,
        isPublic: true,
      }).save();
      await new RecipeLike({
        userId: liker.id,
        recipeId: publicRecipe.id,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({ markedByMe: true });

      expect(result.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Public Recipe" }),
        ]),
      );
    });
  });

  it("does not include recipes favorited by a different user", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const otherUser = await seedUser();
      const viewer = await seedUser();
      const recipe = await new Recipe({
        name: "Shared Recipe",
        userId: owner.id,
        isPublic: true,
      }).save();
      await new RecipeLike({
        userId: otherUser.id,
        recipeId: recipe.id,
      }).save();

      const caller = await makeAuthCaller(viewer.id);
      const result = await caller.recipes.list({ markedByMe: true });

      expect(result.items).toEqual([]);
    });
  });
});

// ─── recipes.list — marked field ─────────────────────────────────────────────

describe("recipes.list — marked field", () => {
  it("anonymous caller — all items have marked: false", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      await new Recipe({ name: "Recipe A", userId: owner.id, isPublic: true }).save();
      await new Recipe({ name: "Recipe B", userId: owner.id, isPublic: true }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.list({ userId: owner.id });

      expect(result.items.length).toBeGreaterThan(0);
      for (const item of result.items) {
        expect(item.marked).toBe(false);
      }
    });
  });

  it("authenticated caller with no likes — all items have marked: false", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const viewer = await seedUser();
      await new Recipe({ name: "Recipe A", userId: owner.id, isPublic: true }).save();
      await new Recipe({ name: "Recipe B", userId: owner.id, isPublic: true }).save();

      const caller = await makeAuthCaller(viewer.id);
      const result = await caller.recipes.list({ userId: owner.id });

      expect(result.items.length).toBeGreaterThan(0);
      for (const item of result.items) {
        expect(item.marked).toBe(false);
      }
    });
  });

  it("authenticated caller liked recipe A not B — A has marked: true, B has marked: false", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const viewer = await seedUser();
      const recipeA = await new Recipe({
        name: "Recipe A",
        userId: owner.id,
        isPublic: true,
      }).save();
      await new Recipe({ name: "Recipe B", userId: owner.id, isPublic: true }).save();
      await new RecipeLike({ userId: viewer.id, recipeId: recipeA.id }).save();

      const caller = await makeAuthCaller(viewer.id);
      const result = await caller.recipes.list({ userId: owner.id });

      expect(result.items).toHaveLength(2);
      const itemA = result.items.find((i) => i.name === "Recipe A");
      const itemB = result.items.find((i) => i.name === "Recipe B");
      expect(itemA?.marked).toBe(true);
      expect(itemB?.marked).toBe(false);
    });
  });

  it("markedByMe: true — liked recipe has marked: true", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const viewer = await seedUser();
      const liked = await new Recipe({
        name: "Liked Recipe",
        userId: owner.id,
        isPublic: true,
      }).save();
      await new Recipe({ name: "Ignored Recipe", userId: owner.id, isPublic: true }).save();
      await new RecipeLike({ userId: viewer.id, recipeId: liked.id }).save();

      const caller = await makeAuthCaller(viewer.id);
      const result = await caller.recipes.list({ markedByMe: true });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ name: "Liked Recipe", marked: true });
    });
  });

  it("markedByMe: true with no likes — result is empty", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const viewer = await seedUser();
      await new Recipe({ name: "Public Recipe", userId: owner.id, isPublic: true }).save();

      const caller = await makeAuthCaller(viewer.id);
      const result = await caller.recipes.list({ markedByMe: true });

      expect(result.items).toEqual([]);
    });
  });
});

// ─── recipes.byId — marked field ─────────────────────────────────────────────

describe("recipes.byId — marked field", () => {
  it("anonymous caller — response has marked: false", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const recipe = await new Recipe({
        name: "Public Recipe",
        userId: owner.id,
        isPublic: true,
      }).save();

      const caller = await makeAnonCaller();
      const result = await caller.recipes.byId({ id: recipe.id });

      expect(result?.marked).toBe(false);
    });
  });

  it("authenticated caller, not liked — marked: false", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const viewer = await seedUser();
      const recipe = await new Recipe({
        name: "Public Recipe",
        userId: owner.id,
        isPublic: true,
      }).save();

      const caller = await makeAuthCaller(viewer.id);
      const result = await caller.recipes.byId({ id: recipe.id });

      expect(result?.marked).toBe(false);
    });
  });

  it("authenticated caller, liked — marked: true", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const viewer = await seedUser();
      const recipe = await new Recipe({
        name: "Public Recipe",
        userId: owner.id,
        isPublic: true,
      }).save();
      await new RecipeLike({ userId: viewer.id, recipeId: recipe.id }).save();

      const caller = await makeAuthCaller(viewer.id);
      const result = await caller.recipes.byId({ id: recipe.id });

      expect(result?.marked).toBe(true);
    });
  });

  it("authenticated caller, liked then toggled off — byId response has marked: false", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const viewer = await seedUser();
      const recipe = await new Recipe({
        name: "Public Recipe",
        userId: owner.id,
        isPublic: true,
      }).save();
      await new RecipeLike({ userId: viewer.id, recipeId: recipe.id }).save();

      const caller = await makeAuthCaller(viewer.id);

      // Confirm liked state
      expect((await caller.recipes.byId({ id: recipe.id }))?.marked).toBe(true);

      // Toggle off
      await caller.recipes.toggleMarked({ id: recipe.id });

      // Now should be false
      const result = await caller.recipes.byId({ id: recipe.id });
      expect(result?.marked).toBe(false);
    });
  });
});

// ─── recipes.isMarked / toggleMarked ──────────────────────────────────────────

describe("recipes.isMarked", () => {
  it("returns false for anonymous users without querying DB", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      expect(await caller.recipes.isMarked({ id: VALID_OBJECT_ID })).toEqual({
        marked: false,
      });
    });
  });
});

describe("recipes.toggleMarked", () => {
  it("rejects unauthenticated requests", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(
        caller.recipes.toggleMarked({ id: VALID_OBJECT_ID }),
      ).rejects.toThrow("UNAUTHORIZED");
    });
  });

  it("cycles through the full isMarked=false → true → false state", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const recipe = await new Recipe({
        name: "Toggle Me",
        userId: user.id,
      }).save();

      const caller = await makeAuthCaller(user.id);

      // Initial state: not marked
      expect(await caller.recipes.isMarked({ id: recipe.id })).toEqual({
        marked: false,
      });

      // First toggle: mark it
      expect(await caller.recipes.toggleMarked({ id: recipe.id })).toEqual({
        marked: true,
      });
      expect(await caller.recipes.isMarked({ id: recipe.id })).toEqual({
        marked: true,
      });

      // Second toggle: unmark it
      expect(await caller.recipes.toggleMarked({ id: recipe.id })).toEqual({
        marked: false,
      });
      expect(await caller.recipes.isMarked({ id: recipe.id })).toEqual({
        marked: false,
      });
    });
  });
});

// ─── recipes.import ──────────────────────────────────────────────────────────

describe("recipes.import", () => {
  it("creates a new recipe for the authenticated user", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const caller = await makeAuthCaller(user.id);

      const result = await caller.recipes.import({
        name: "Imported Dish",
        ingredients: "2 eggs",
        instructions: "Whisk and cook",
        servings: 2,
        _version: "1",
      });

      expect(result).toMatchObject({ name: "Imported Dish" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const saved = (await Recipe.findById(result.id).lean()) as any;
      expect(saved?.name).toBe("Imported Dish");
      expect(saved?.userId?.toString()).toBe(user.id);
    });
  });

  it("fails validation for invalid payload", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const caller = await makeAuthCaller(user.id);

      await expect(
        caller.recipes.import({
          name: "",
          _version: "1",
        }),
      ).rejects.toThrow();
    });
  });

  it("fails validation for invalid dateAdded", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const caller = await makeAuthCaller(user.id);

      await expect(
        caller.recipes.import({
          name: "Bad Date Import",
          dateAdded: "not-a-date",
          _version: "1",
        }),
      ).rejects.toThrow();
    });
  });
});
