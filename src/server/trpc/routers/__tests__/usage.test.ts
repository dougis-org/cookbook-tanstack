// @vitest-environment node
import { describe, it, expect } from "vitest"
import mongoose from "mongoose"
import { withCleanDb } from "@/test-helpers/with-clean-db"
import { Recipe, Cookbook } from "@/db/models"
import { makeAuthCaller, makeAnonCaller, seedUserWithBetterAuth } from "./test-helpers"

describe("usage.getOwned", () => {
  it("returns { recipeCount, cookbookCount } for authenticated user with content", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id)
      await new Recipe({ name: "R1", userId: user.id, isPublic: true }).save()
      await new Recipe({ name: "R2", userId: user.id, isPublic: true }).save()
      await new Cookbook({ name: "C1", userId: user.id, isPublic: true }).save()
      const result = await caller.usage.getOwned()
      expect(result).toEqual({ recipeCount: 2, cookbookCount: 1 })
    })
  })

  it("excludes hiddenByTier recipes from recipeCount", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id)
      await new Recipe({ name: "Visible", userId: user.id, isPublic: true }).save()
      await Recipe.collection.insertOne({
        name: "Hidden",
        userId: new mongoose.Types.ObjectId(user.id),
        isPublic: true,
        hiddenByTier: true,
        mealIds: [],
        courseIds: [],
        preparationIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const result = await caller.usage.getOwned()
      expect(result).toEqual({ recipeCount: 1, cookbookCount: 0 })
    })
  })

  it("excludes hiddenByTier cookbooks from cookbookCount", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id)
      await new Cookbook({ name: "Visible", userId: user.id, isPublic: true }).save()
      await Cookbook.collection.insertOne({
        name: "Hidden",
        userId: new mongoose.Types.ObjectId(user.id),
        isPublic: true,
        hiddenByTier: true,
        recipes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const result = await caller.usage.getOwned()
      expect(result).toEqual({ recipeCount: 0, cookbookCount: 1 })
    })
  })

  it("returns { recipeCount: 0, cookbookCount: 0 } for user with no content", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id)
      const result = await caller.usage.getOwned()
      expect(result).toEqual({ recipeCount: 0, cookbookCount: 0 })
    })
  })

  it("throws UNAUTHORIZED for unauthenticated call", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller()
      await expect(caller.usage.getOwned()).rejects.toMatchObject({ code: "UNAUTHORIZED" })
    })
  })
})
