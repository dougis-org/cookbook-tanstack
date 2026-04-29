// @vitest-environment node
import { describe, it, expect, vi } from "vitest"
import mongoose from "mongoose"
import { withCleanDb } from "@/test-helpers/with-clean-db"
import { Recipe, Cookbook } from "@/db/models"
import { seedUserWithBetterAuth } from "./test-helpers"

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

// ─── Pure-logic unit tests (no DB required) ─────────────────────────────────

describe("visibilityFilter", () => {
  it("returns { isPublic: true } for anonymous users", async () => {
    const { visibilityFilter } = await import("../_helpers")
    const result = visibilityFilter(null)
    expect(result).toEqual({ isPublic: true })
  })

  it("returns { $or: [{ isPublic: true }, { userId }] } for authenticated users", async () => {
    const { visibilityFilter } = await import("../_helpers")
    const result = visibilityFilter({ id: "u1" })
    expect(result).toEqual({ $or: [{ isPublic: true }, { userId: "u1" }] })
  })
})

describe("verifyOwnership", () => {
  it("throws NOT_FOUND when record does not exist (fetchRecord returns null)", async () => {
    const { verifyOwnership } = await import("../_helpers")
    await expect(verifyOwnership(vi.fn().mockResolvedValue(null), "u1", "Recipe")).rejects.toThrow("Recipe not found")
  })

  it("throws FORBIDDEN when user is not the owner", async () => {
    const { verifyOwnership } = await import("../_helpers")
    await expect(
      verifyOwnership(vi.fn().mockResolvedValue({ userId: "other" }), "u1", "Recipe"),
    ).rejects.toThrow("Not your recipe")
  })

  it("returns the record when user is the owner", async () => {
    const { verifyOwnership } = await import("../_helpers")
    const record = { userId: "u1", name: "My Recipe" }
    expect(await verifyOwnership(vi.fn().mockResolvedValue(record), "u1", "Recipe")).toBe(record)
  })

  it("supports userId as an ObjectId-like object with toString()", async () => {
    const { verifyOwnership } = await import("../_helpers")
    const record = { userId: { toString: () => "u1" }, name: "My Recipe" }
    expect(await verifyOwnership(vi.fn().mockResolvedValue(record), "u1", "Recipe")).toBe(record)
  })
})

// ─── enforceContentLimit ────────────────────────────────────────────────────

type ECL = (userId: string, tier: string | undefined, isAdmin: boolean, resource: "recipes" | "cookbooks") => Promise<void>

async function withECLCtx(cb: (ecl: ECL, userId: string) => Promise<void>) {
  await withCleanDb(async () => {
    const { enforceContentLimit } = await import("../_helpers")
    const user = await seedUserWithBetterAuth()
    await cb(enforceContentLimit, user.id)
  })
}

describe("enforceContentLimit — recipes", () => {
  it("throws PAYMENT_REQUIRED when home-cook user is at the 10-recipe limit", async () => {
    await withECLCtx(async (ecl, userId) => {
      for (let i = 0; i < 10; i++) {
        await new Recipe({ name: `Recipe ${i}`, userId, isPublic: true }).save()
      }
      await expect(ecl(userId, "home-cook", false, "recipes")).rejects.toMatchObject({ code: "PAYMENT_REQUIRED" })
    })
  })

  it("resolves when home-cook user is under the 10-recipe limit", async () => {
    await withECLCtx(async (ecl, userId) => {
      for (let i = 0; i < 9; i++) {
        await new Recipe({ name: `Recipe ${i}`, userId, isPublic: true }).save()
      }
      await expect(ecl(userId, "home-cook", false, "recipes")).resolves.toBeUndefined()
    })
  })

  it("resolves when isAdmin is true regardless of count", async () => {
    await withECLCtx(async (ecl, userId) => {
      for (let i = 0; i < 10; i++) {
        await new Recipe({ name: `Recipe ${i}`, userId, isPublic: true }).save()
      }
      await expect(ecl(userId, "home-cook", true, "recipes")).resolves.toBeUndefined()
    })
  })

  it("excludes hiddenByTier docs from the count — 10 total with 1 hidden resolves", async () => {
    await withECLCtx(async (ecl, userId) => {
      for (let i = 0; i < 9; i++) {
        await new Recipe({ name: `Recipe ${i}`, userId, isPublic: true }).save()
      }
      await Recipe.collection.insertOne({
        name: "Hidden Recipe",
        userId: new mongoose.Types.ObjectId(userId),
        isPublic: true,
        hiddenByTier: true,
        mealIds: [],
        courseIds: [],
        preparationIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await expect(ecl(userId, "home-cook", false, "recipes")).resolves.toBeUndefined()
    })
  })

  it("defaults missing tier to home-cook and throws PAYMENT_REQUIRED at 10 recipes", async () => {
    await withECLCtx(async (ecl, userId) => {
      for (let i = 0; i < 10; i++) {
        await new Recipe({ name: `Recipe ${i}`, userId, isPublic: true }).save()
      }
      await expect(ecl(userId, undefined, false, "recipes")).rejects.toMatchObject({ code: "PAYMENT_REQUIRED" })
    })
  })
})

describe("enforceContentLimit — cookbooks", () => {
  it("throws PAYMENT_REQUIRED when home-cook user is at the 1-cookbook limit", async () => {
    await withECLCtx(async (ecl, userId) => {
      await new Cookbook({ name: "My Cookbook", userId, isPublic: true }).save()
      await expect(ecl(userId, "home-cook", false, "cookbooks")).rejects.toMatchObject({ code: "PAYMENT_REQUIRED" })
    })
  })

  it("resolves when home-cook user has 0 cookbooks", async () => {
    await withECLCtx(async (ecl, userId) => {
      await expect(ecl(userId, "home-cook", false, "cookbooks")).resolves.toBeUndefined()
    })
  })

  it("resolves when isAdmin is true regardless of cookbook count", async () => {
    await withECLCtx(async (ecl, userId) => {
      await new Cookbook({ name: "My Cookbook", userId, isPublic: true }).save()
      await expect(ecl(userId, "home-cook", true, "cookbooks")).resolves.toBeUndefined()
    })
  })

  it("excludes hiddenByTier cookbooks from the count — 1 total with 1 hidden resolves", async () => {
    await withECLCtx(async (ecl, userId) => {
      await Cookbook.collection.insertOne({
        name: "Hidden Cookbook",
        userId: new mongoose.Types.ObjectId(userId),
        isPublic: true,
        hiddenByTier: true,
        recipes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await expect(ecl(userId, "home-cook", false, "cookbooks")).resolves.toBeUndefined()
    })
  })
})
