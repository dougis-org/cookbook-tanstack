// @vitest-environment node
import { describe, it, expect, vi } from "vitest"

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
