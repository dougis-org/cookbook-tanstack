// @vitest-environment node
/**
 * Unit tests for with-db-tx.ts error paths and idempotency.
 *
 * We use vi.resetModules() + vi.doMock() in each test to get a fresh module
 * instance (and therefore fresh `poolPromise = null` state) without touching
 * a real database.
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest"

// These helpers are rebuilt per test after vi.resetModules(), so we declare
// the mock handles at describe scope and assign them in beforeEach.
let mockRelease: Mock
let mockQuery: Mock
let mockConnect: Mock
let mockEnd: Mock

beforeEach(() => {
  vi.resetModules()

  mockRelease = vi.fn()
  mockQuery = vi.fn().mockResolvedValue(undefined)
  mockConnect = vi.fn().mockResolvedValue({ query: mockQuery, release: mockRelease })
  mockEnd = vi.fn().mockResolvedValue(undefined)

  vi.doMock("pg", () => ({
    Pool: vi.fn().mockImplementation(() => ({ connect: mockConnect, end: mockEnd })),
  }))
  vi.doMock("drizzle-orm/node-postgres", () => ({
    drizzle: vi.fn().mockReturnValue({}),
  }))
  vi.doMock("@/db/schema", () => ({}))

  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"
})

afterEach(() => {
  delete process.env.DATABASE_URL
})

describe("withDbTx", () => {
  it("issues BEGIN, passes a db to fn, then ROLLBACK and releases", async () => {
    const { withDbTx } = await import("@/test-helpers/with-db-tx")
    const fn = vi.fn().mockResolvedValue("result")

    const result = await withDbTx(fn)

    expect(result).toBe("result")
    expect(mockQuery).toHaveBeenCalledWith("BEGIN")
    expect(fn).toHaveBeenCalledOnce()
    expect(mockQuery).toHaveBeenCalledWith("ROLLBACK")
    expect(mockRelease).toHaveBeenCalledOnce()
  })

  it("rolls back and releases client even when fn throws", async () => {
    const { withDbTx } = await import("@/test-helpers/with-db-tx")
    const fn = vi.fn().mockRejectedValue(new Error("fn error"))

    await expect(withDbTx(fn)).rejects.toThrow("fn error")

    expect(mockQuery).toHaveBeenCalledWith("ROLLBACK")
    expect(mockRelease).toHaveBeenCalledOnce()
  })

  it("still releases client when ROLLBACK itself throws", async () => {
    const { withDbTx } = await import("@/test-helpers/with-db-tx")
    mockQuery
      .mockResolvedValueOnce(undefined) // BEGIN succeeds
      .mockRejectedValueOnce(new Error("ROLLBACK failed")) // ROLLBACK throws

    await expect(withDbTx(vi.fn().mockResolvedValue(undefined))).rejects.toThrow("ROLLBACK failed")

    // release() must still be called to avoid pool exhaustion
    expect(mockRelease).toHaveBeenCalledOnce()
  })

  it("throws a clear error when DATABASE_URL is not set", async () => {
    delete process.env.DATABASE_URL
    const { withDbTx } = await import("@/test-helpers/with-db-tx")

    await expect(withDbTx(vi.fn())).rejects.toThrow(
      "DATABASE_URL not set — ensure db-global-setup runs before DB tests",
    )
  })
})

describe("closeTestPool", () => {
  it("is a no-op when the pool has never been initialized", async () => {
    const { closeTestPool } = await import("@/test-helpers/with-db-tx")

    await expect(closeTestPool()).resolves.toBeUndefined()
    expect(mockEnd).not.toHaveBeenCalled()
  })

  it("calls pool.end() on an initialized pool", async () => {
    const { withDbTx, closeTestPool } = await import("@/test-helpers/with-db-tx")
    await withDbTx(vi.fn().mockResolvedValue(undefined))

    await closeTestPool()

    expect(mockEnd).toHaveBeenCalledOnce()
  })

  it("is idempotent — a second call after close is a no-op", async () => {
    const { withDbTx, closeTestPool } = await import("@/test-helpers/with-db-tx")
    await withDbTx(vi.fn().mockResolvedValue(undefined))

    await closeTestPool()
    await closeTestPool() // second call must not throw or double-end

    expect(mockEnd).toHaveBeenCalledOnce()
  })
})
