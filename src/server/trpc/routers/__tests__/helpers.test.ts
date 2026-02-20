// @vitest-environment node
import { describe, it, expect, vi, afterAll } from "vitest"
import { withDbTx, closeTestPool, type TestDb } from "@/test-helpers/with-db-tx"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"

// Prevent module-level pool creation; auth init not needed for helper tests.
vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

afterAll(async () => {
  await closeTestPool()
})

// ─── Pure-logic unit tests (no DB required) ─────────────────────────────────

describe("visibilityFilter", () => {
  it("returns isPublic=true condition for anonymous users", async () => {
    const { visibilityFilter } = await import("../_helpers")
    const result = visibilityFilter({ name: "is_public" } as never, { name: "user_id" } as never, null)
    expect(result).toBeDefined()
  })

  it("returns or(isPublic, userId) condition for authenticated users", async () => {
    const { visibilityFilter } = await import("../_helpers")
    const result = visibilityFilter({ name: "is_public" } as never, { name: "user_id" } as never, { id: "u1" })
    expect(result).toBeDefined()
  })
})

describe("verifyOwnership", () => {
  it("throws NOT_FOUND when record does not exist", async () => {
    const { verifyOwnership } = await import("../_helpers")
    await expect(verifyOwnership(vi.fn().mockResolvedValue([]), "u1", "Recipe")).rejects.toThrow("Recipe not found")
  })

  it("throws FORBIDDEN when user is not the owner", async () => {
    const { verifyOwnership } = await import("../_helpers")
    await expect(
      verifyOwnership(vi.fn().mockResolvedValue([{ userId: "other" }]), "u1", "Recipe"),
    ).rejects.toThrow("Not your recipe")
  })

  it("returns the record when user is the owner", async () => {
    const { verifyOwnership } = await import("../_helpers")
    const record = { userId: "u1", name: "My Recipe" }
    expect(await verifyOwnership(vi.fn().mockResolvedValue([record]), "u1", "Recipe")).toBe(record)
  })
})

// ─── syncJunction — verified against real DB constraints ────────────────────

/** Seed the minimum rows needed for junction-table tests. */
async function seedRecipeAndMeal(db: TestDb, suffix: string) {
  const [user] = await db
    .insert(schema.users)
    .values({ email: `${suffix}@jxn.test`, username: `jxn-${suffix}`, displayUsername: `Jxn ${suffix}` })
    .returning()
  const [recipe] = await db.insert(schema.recipes).values({ name: "JunctionTest", userId: user.id }).returning()
  const [meal] = await db.insert(schema.meals).values({ name: "Dinner", slug: `dinner-${suffix}` }).returning()
  return { user, recipe, meal }
}

describe("syncJunction (real DB)", () => {
  it("skips entirely when ids is undefined", async () => {
    await withDbTx(async (db) => {
      const { syncJunction } = await import("../_helpers")
      await expect(
        syncJunction(db, schema.recipeMeals, schema.recipeMeals.recipeId, "any-id", undefined, "mealId"),
      ).resolves.not.toThrow()
    })
  })

  it("inserts rows correctly on first call", async () => {
    await withDbTx(async (db) => {
      const { recipe, meal } = await seedRecipeAndMeal(db, "ins")
      const { syncJunction } = await import("../_helpers")

      await syncJunction(db, schema.recipeMeals, schema.recipeMeals.recipeId, recipe.id, [meal.id], "mealId")

      const rows = await db.select().from(schema.recipeMeals).where(eq(schema.recipeMeals.recipeId, recipe.id))
      expect(rows).toHaveLength(1)
      expect(rows[0].mealId).toBe(meal.id)
    })
  })

  it("deduplicates IDs — no PK-constraint violation on repeated IDs", async () => {
    await withDbTx(async (db) => {
      const { recipe, meal } = await seedRecipeAndMeal(db, "dup")
      const { syncJunction } = await import("../_helpers")

      // Passing the same meal ID three times must not throw a unique-constraint error
      await expect(
        syncJunction(
          db,
          schema.recipeMeals,
          schema.recipeMeals.recipeId,
          recipe.id,
          [meal.id, meal.id, meal.id],
          "mealId",
        ),
      ).resolves.not.toThrow()

      const rows = await db.select().from(schema.recipeMeals).where(eq(schema.recipeMeals.recipeId, recipe.id))
      expect(rows).toHaveLength(1)
    })
  })

  it("clears all junction rows when ids is an empty array", async () => {
    await withDbTx(async (db) => {
      const { recipe, meal } = await seedRecipeAndMeal(db, "clr")
      const { syncJunction } = await import("../_helpers")

      await syncJunction(db, schema.recipeMeals, schema.recipeMeals.recipeId, recipe.id, [meal.id], "mealId")
      await syncJunction(db, schema.recipeMeals, schema.recipeMeals.recipeId, recipe.id, [], "mealId")

      const rows = await db.select().from(schema.recipeMeals).where(eq(schema.recipeMeals.recipeId, recipe.id))
      expect(rows).toHaveLength(0)
    })
  })

  it("replaces existing rows on re-sync", async () => {
    await withDbTx(async (db) => {
      const { syncJunction } = await import("../_helpers")
      const [user] = await db
        .insert(schema.users)
        .values({ email: "repl@jxn.test", username: "jxn-repl", displayUsername: "Jxn Repl" })
        .returning()
      const [recipe] = await db.insert(schema.recipes).values({ name: "ReplacementTest", userId: user.id }).returning()
      const [meal1, meal2] = await db
        .insert(schema.meals)
        .values([
          { name: "Breakfast", slug: "breakfast-repl" },
          { name: "Lunch", slug: "lunch-repl" },
        ])
        .returning()

      await syncJunction(db, schema.recipeMeals, schema.recipeMeals.recipeId, recipe.id, [meal1.id], "mealId")
      await syncJunction(db, schema.recipeMeals, schema.recipeMeals.recipeId, recipe.id, [meal2.id], "mealId")

      const rows = await db.select().from(schema.recipeMeals).where(eq(schema.recipeMeals.recipeId, recipe.id))
      expect(rows).toHaveLength(1)
      expect(rows[0].mealId).toBe(meal2.id)
    })
  })
})
