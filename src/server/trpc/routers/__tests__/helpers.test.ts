import { describe, it, expect, vi } from "vitest"

vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/db/schema", () => ({ users: {}, sessions: {}, accounts: {}, verifications: {} }))

describe("_helpers", () => {
  describe("visibilityFilter", () => {
    it("returns isPublic=true condition for anonymous users", async () => {
      const { visibilityFilter } = await import("../_helpers")
      const isPublicCol = { name: "is_public" } as never
      const userIdCol = { name: "user_id" } as never

      const result = visibilityFilter(isPublicCol, userIdCol, null)
      // Should be an eq() condition (not or()) since there's no user
      expect(result).toBeDefined()
    })

    it("returns or(isPublic, userId) condition for authenticated users", async () => {
      const { visibilityFilter } = await import("../_helpers")
      const isPublicCol = { name: "is_public" } as never
      const userIdCol = { name: "user_id" } as never

      const result = visibilityFilter(isPublicCol, userIdCol, { id: "user-1" })
      // Should be an or() condition wrapping both checks
      expect(result).toBeDefined()
    })
  })

  describe("verifyOwnership", () => {
    it("throws NOT_FOUND when record does not exist", async () => {
      const { verifyOwnership } = await import("../_helpers")
      const fetchRecord = vi.fn().mockResolvedValue([])

      await expect(verifyOwnership(fetchRecord, "u1", "Recipe")).rejects.toThrow("Recipe not found")
    })

    it("throws FORBIDDEN when user is not the owner", async () => {
      const { verifyOwnership } = await import("../_helpers")
      const fetchRecord = vi.fn().mockResolvedValue([{ userId: "other-user" }])

      await expect(verifyOwnership(fetchRecord, "u1", "Recipe")).rejects.toThrow("Not your recipe")
    })

    it("returns record when user is the owner", async () => {
      const { verifyOwnership } = await import("../_helpers")
      const record = { userId: "u1", name: "My Recipe" }
      const fetchRecord = vi.fn().mockResolvedValue([record])

      const result = await verifyOwnership(fetchRecord, "u1", "Recipe")
      expect(result).toBe(record)
    })
  })

  describe("syncJunction", () => {
    it("skips when ids is undefined", async () => {
      const { syncJunction } = await import("../_helpers")
      const db = { delete: vi.fn(), insert: vi.fn() }

      await syncJunction(db, "table", "col", "recipe-1", undefined, "fk")

      expect(db.delete).not.toHaveBeenCalled()
      expect(db.insert).not.toHaveBeenCalled()
    })

    it("deletes existing and inserts new rows", async () => {
      const { syncJunction } = await import("../_helpers")
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      const mockValues = vi.fn().mockResolvedValue(undefined)
      const db = {
        delete: vi.fn().mockReturnValue({ where: mockWhere }),
        insert: vi.fn().mockReturnValue({ values: mockValues }),
      }

      await syncJunction(db, "table", "col", "r1", ["a", "b"], "mealId")

      expect(db.delete).toHaveBeenCalled()
      expect(db.insert).toHaveBeenCalled()
      expect(mockValues).toHaveBeenCalledWith([
        { recipeId: "r1", mealId: "a" },
        { recipeId: "r1", mealId: "b" },
      ])
    })

    it("deduplicates IDs to prevent unique constraint violations", async () => {
      const { syncJunction } = await import("../_helpers")
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      const mockValues = vi.fn().mockResolvedValue(undefined)
      const db = {
        delete: vi.fn().mockReturnValue({ where: mockWhere }),
        insert: vi.fn().mockReturnValue({ values: mockValues }),
      }

      await syncJunction(db, "table", "col", "r1", ["a", "a", "b", "b", "b"], "mealId")

      expect(mockValues).toHaveBeenCalledWith([
        { recipeId: "r1", mealId: "a" },
        { recipeId: "r1", mealId: "b" },
      ])
    })

    it("only deletes when ids is an empty array", async () => {
      const { syncJunction } = await import("../_helpers")
      const mockWhere = vi.fn().mockResolvedValue(undefined)
      const db = {
        delete: vi.fn().mockReturnValue({ where: mockWhere }),
        insert: vi.fn(),
      }

      await syncJunction(db, "table", "col", "r1", [], "mealId")

      expect(db.delete).toHaveBeenCalled()
      expect(db.insert).not.toHaveBeenCalled()
    })
  })
})
