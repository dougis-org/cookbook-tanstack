// @vitest-environment node
import { describe, it, expect } from "vitest"
import { Types } from "mongoose"
import { withCleanDb } from "@/test-helpers/with-clean-db"
import { Recipe, RecipeNote } from "@/db/models"
import {
  makeAnonCaller,
  makeTieredCaller,
  seedUserWithBetterAuth,
  makeAuthCaller,
} from "./test-helpers"

describe("privateRecipeNotes.get", () => {
  it("anonymous caller throws UNAUTHORIZED", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller()
      const recipeId = new Types.ObjectId().toHexString()
      await expect(caller.privateRecipeNotes.get({ recipeId })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      })
    })
  })

  it("home-cook, no note → { hasNote: false, note: null }", async () => {
    await withCleanDb(async () => {
      const caller = await makeTieredCaller("home-cook")
      const recipeId = new Types.ObjectId().toHexString()
      const result = await caller.privateRecipeNotes.get({ recipeId })
      expect(result).toEqual({ hasNote: false, note: null })
    })
  })

  it("prep-cook, no note → { hasNote: false, note: null }", async () => {
    await withCleanDb(async () => {
      const caller = await makeTieredCaller("prep-cook")
      const recipeId = new Types.ObjectId().toHexString()
      const result = await caller.privateRecipeNotes.get({ recipeId })
      expect(result).toEqual({ hasNote: false, note: null })
    })
  })

  it("home-cook, note exists → { hasNote: true, note: null }", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: "home-cook" })
      const recipeId = new Types.ObjectId()
      await RecipeNote.create({
        userId: new Types.ObjectId(user.id),
        recipeId,
        body: "My note",
      })
      const result = await caller.privateRecipeNotes.get({ recipeId: recipeId.toHexString() })
      expect(result).toEqual({ hasNote: true, note: null })
    })
  })

  it("prep-cook, note exists → { hasNote: true, note: null }", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: "prep-cook" })
      const recipeId = new Types.ObjectId()
      await RecipeNote.create({
        userId: new Types.ObjectId(user.id),
        recipeId,
        body: "My note",
      })
      const result = await caller.privateRecipeNotes.get({ recipeId: recipeId.toHexString() })
      expect(result).toEqual({ hasNote: true, note: null })
    })
  })

  it("sous-chef, no note → { hasNote: false, note: null }", async () => {
    await withCleanDb(async () => {
      const caller = await makeTieredCaller("sous-chef")
      const recipeId = new Types.ObjectId().toHexString()
      const result = await caller.privateRecipeNotes.get({ recipeId })
      expect(result).toEqual({ hasNote: false, note: null })
    })
  })

  it("sous-chef, note exists → { hasNote: true, note: { body, updatedAt } }", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: "sous-chef" })
      const recipeId = new Types.ObjectId()
      await RecipeNote.create({
        userId: new Types.ObjectId(user.id),
        recipeId,
        body: "My sous-chef note",
      })
      const result = await caller.privateRecipeNotes.get({ recipeId: recipeId.toHexString() })
      expect(result.hasNote).toBe(true)
      expect(result.note).not.toBeNull()
      expect(result.note!.body).toBe("My sous-chef note")
      expect(result.note!.updatedAt).toBeInstanceOf(Date)
    })
  })

  it("executive-chef, note exists → returns full note", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: "executive-chef" })
      const recipeId = new Types.ObjectId()
      await RecipeNote.create({
        userId: new Types.ObjectId(user.id),
        recipeId,
        body: "Executive note",
      })
      const result = await caller.privateRecipeNotes.get({ recipeId: recipeId.toHexString() })
      expect(result.hasNote).toBe(true)
      expect(result.note!.body).toBe("Executive note")
      expect(result.note!.updatedAt).toBeInstanceOf(Date)
    })
  })
})

describe("privateRecipeNotes.upsert", () => {
  it("home-cook throws FORBIDDEN", async () => {
    await withCleanDb(async () => {
      const caller = await makeTieredCaller("home-cook")
      const recipeId = new Types.ObjectId().toHexString()
      await expect(caller.privateRecipeNotes.upsert({ recipeId, body: "hi" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      })
    })
  })

  it("prep-cook throws FORBIDDEN", async () => {
    await withCleanDb(async () => {
      const caller = await makeTieredCaller("prep-cook")
      const recipeId = new Types.ObjectId().toHexString()
      await expect(caller.privateRecipeNotes.upsert({ recipeId, body: "hi" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      })
    })
  })

  it("body of 10001 chars throws BAD_REQUEST", async () => {
    await withCleanDb(async () => {
      const caller = await makeTieredCaller("sous-chef")
      const recipeId = new Types.ObjectId().toHexString()
      const body = "a".repeat(10001)
      await expect(caller.privateRecipeNotes.upsert({ recipeId, body })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      })
    })
  })

  it("unknown recipeId throws NOT_FOUND", async () => {
    await withCleanDb(async () => {
      const caller = await makeTieredCaller("sous-chef")
      const recipeId = new Types.ObjectId().toHexString()
      await expect(caller.privateRecipeNotes.upsert({ recipeId, body: "hello" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      })
    })
  })

  it("private recipe owned by another user throws NOT_FOUND", async () => {
    await withCleanDb(async () => {
      const otherUser = await seedUserWithBetterAuth()
      const recipe = await new Recipe({
        name: "Private Recipe",
        userId: new Types.ObjectId(otherUser.id),
        isPublic: false,
      }).save()
      const caller = await makeTieredCaller("sous-chef")
      await expect(
        caller.privateRecipeNotes.upsert({ recipeId: recipe._id.toHexString(), body: "hi" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" })
    })
  })

  it("public recipe → note created; get returns full note as sous-chef", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: "sous-chef" })
      const recipe = await new Recipe({
        name: "Public Recipe",
        userId: new Types.ObjectId(user.id),
        isPublic: true,
      }).save()
      await caller.privateRecipeNotes.upsert({ recipeId: recipe._id.toHexString(), body: "Hello" })
      const result = await caller.privateRecipeNotes.get({ recipeId: recipe._id.toHexString() })
      expect(result.hasNote).toBe(true)
      expect(result.note!.body).toBe("Hello")
    })
  })

  it("own private recipe → note created successfully", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: "sous-chef" })
      const recipe = await new Recipe({
        name: "My Private Recipe",
        userId: new Types.ObjectId(user.id),
        isPublic: false,
      }).save()
      const result = await caller.privateRecipeNotes.upsert({
        recipeId: recipe._id.toHexString(),
        body: "Private",
      })
      expect(result).toEqual({ success: true })
    })
  })

  it("second upsert overwrites first; only one document exists", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: "sous-chef" })
      const recipe = await new Recipe({
        name: "Recipe",
        userId: new Types.ObjectId(user.id),
        isPublic: true,
      }).save()
      const recipeId = recipe._id.toHexString()
      await caller.privateRecipeNotes.upsert({ recipeId, body: "Old text" })
      await caller.privateRecipeNotes.upsert({ recipeId, body: "New text" })
      const count = await RecipeNote.countDocuments({
        userId: new Types.ObjectId(user.id),
        recipeId: recipe._id,
      })
      expect(count).toBe(1)
      const getResult = await caller.privateRecipeNotes.get({ recipeId })
      expect(getResult.note!.body).toBe("New text")
    })
  })

  it("body of exactly 10000 chars is accepted", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: "sous-chef" })
      const recipe = await new Recipe({
        name: "Recipe",
        userId: new Types.ObjectId(user.id),
        isPublic: true,
      }).save()
      const body = "a".repeat(10000)
      const result = await caller.privateRecipeNotes.upsert({
        recipeId: recipe._id.toHexString(),
        body,
      })
      expect(result).toEqual({ success: true })
    })
  })
})

describe("privateRecipeNotes.delete", () => {
  it("home-cook throws FORBIDDEN", async () => {
    await withCleanDb(async () => {
      const caller = await makeTieredCaller("home-cook")
      const recipeId = new Types.ObjectId().toHexString()
      await expect(caller.privateRecipeNotes.delete({ recipeId })).rejects.toMatchObject({
        code: "FORBIDDEN",
      })
    })
  })

  it("prep-cook throws FORBIDDEN", async () => {
    await withCleanDb(async () => {
      const caller = await makeTieredCaller("prep-cook")
      const recipeId = new Types.ObjectId().toHexString()
      await expect(caller.privateRecipeNotes.delete({ recipeId })).rejects.toMatchObject({
        code: "FORBIDDEN",
      })
    })
  })

  it("sous-chef deletes existing note; get returns { hasNote: false, note: null }", async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: "sous-chef" })
      const recipe = await new Recipe({
        name: "Recipe",
        userId: new Types.ObjectId(user.id),
        isPublic: true,
      }).save()
      const recipeId = recipe._id.toHexString()
      await caller.privateRecipeNotes.upsert({ recipeId, body: "Note to delete" })
      await caller.privateRecipeNotes.delete({ recipeId })
      const result = await caller.privateRecipeNotes.get({ recipeId })
      expect(result).toEqual({ hasNote: false, note: null })
    })
  })

  it("sous-chef, no note exists → throws NOT_FOUND", async () => {
    await withCleanDb(async () => {
      const caller = await makeTieredCaller("sous-chef")
      const recipeId = new Types.ObjectId().toHexString()
      await expect(caller.privateRecipeNotes.delete({ recipeId })).rejects.toMatchObject({
        code: "NOT_FOUND",
      })
    })
  })
})
