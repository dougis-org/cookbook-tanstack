// @vitest-environment node
/**
 * Unit tests for db-global-setup.ts error paths.
 *
 * Each test uses vi.resetModules() + vi.doMock() to get a fresh module
 * instance with a fresh (unset) `container` variable.
 */
import { describe, it, expect, vi, afterEach } from "vitest"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("teardown", () => {
  it("is safe to call when setup() has never run (container is undefined)", async () => {
    vi.resetModules()
    vi.doMock("@testcontainers/postgresql", () => ({ PostgreSqlContainer: vi.fn() }))
    vi.doMock("drizzle-orm/node-postgres", () => ({ drizzle: vi.fn() }))
    vi.doMock("drizzle-orm/node-postgres/migrator", () => ({ migrate: vi.fn() }))
    vi.doMock("pg", () => ({ Pool: vi.fn() }))

    const { teardown } = await import("@/test-helpers/db-global-setup")

    // container is still undefined — optional chaining makes this a no-op
    await expect(teardown()).resolves.toBeUndefined()
  })

  it("logs the error and does not rethrow when container.stop() fails", async () => {
    vi.resetModules()

    const mockStop = vi.fn().mockRejectedValue(new Error("network timeout"))
    const mockContainer = {
      getConnectionUri: vi.fn().mockReturnValue("postgresql://test:test@localhost:5432/test"),
      stop: mockStop,
    }

    vi.doMock("@testcontainers/postgresql", () => ({
      PostgreSqlContainer: vi.fn().mockImplementation(() => ({
        start: vi.fn().mockResolvedValue(mockContainer),
      })),
    }))
    vi.doMock("drizzle-orm/node-postgres", () => ({ drizzle: vi.fn().mockReturnValue({}) }))
    vi.doMock("drizzle-orm/node-postgres/migrator", () => ({
      migrate: vi.fn().mockResolvedValue(undefined),
    }))
    vi.doMock("pg", () => ({
      Pool: vi.fn().mockImplementation(() => ({ end: vi.fn().mockResolvedValue(undefined) })),
    }))

    const { setup, teardown } = await import("@/test-helpers/db-global-setup")

    // Run setup so that `container` is assigned — we save/restore DATABASE_URL
    // because setup() overwrites it with the (mocked) container's URI.
    const savedUrl = process.env.DATABASE_URL
    await setup()
    process.env.DATABASE_URL = savedUrl

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(teardown()).resolves.toBeUndefined()
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to stop Testcontainers PostgreSQL container:",
      expect.any(Error),
    )
  })
})
