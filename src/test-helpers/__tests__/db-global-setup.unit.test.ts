// @vitest-environment node
/**
 * Unit tests for db-global-setup.ts.
 *
 * Each test uses vi.resetModules() + vi.doMock() to get a fresh module
 * instance with a fresh (unset) `mongod` variable.
 */
import { describe, it, expect, vi, afterEach } from "vitest"

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.MONGODB_URI
})

describe("setup", () => {
  it("starts mongodb-memory-server, sets MONGODB_URI, and connects Mongoose", async () => {
    vi.resetModules()

    const mockUri = "mongodb://127.0.0.1:27017/test"
    const mockGetUri = vi.fn().mockReturnValue(mockUri)
    const mockCreate = vi.fn().mockResolvedValue({ getUri: mockGetUri, stop: vi.fn() })
    const mockConnect = vi.fn().mockResolvedValue(undefined)

    vi.doMock("mongodb-memory-server", () => ({
      MongoMemoryServer: { create: mockCreate },
    }))
    vi.doMock("mongoose", () => ({
      default: { connect: mockConnect, disconnect: vi.fn().mockResolvedValue(undefined) },
    }))

    const { setup } = await import("@/test-helpers/db-global-setup")
    await setup()

    expect(mockCreate).toHaveBeenCalledOnce()
    expect(process.env.MONGODB_URI).toBe(mockUri)
    expect(mockConnect).toHaveBeenCalledWith(mockUri)
  })
})

describe("teardown", () => {
  it("is safe to call when setup() has never run (mongod is undefined)", async () => {
    vi.resetModules()

    const mockDisconnect = vi.fn().mockResolvedValue(undefined)

    vi.doMock("mongodb-memory-server", () => ({
      MongoMemoryServer: { create: vi.fn() },
    }))
    vi.doMock("mongoose", () => ({
      default: { connect: vi.fn(), disconnect: mockDisconnect },
    }))

    const { teardown } = await import("@/test-helpers/db-global-setup")

    // mongod is still undefined — optional chaining makes stop a no-op
    await expect(teardown()).resolves.toBeUndefined()
    expect(mockDisconnect).toHaveBeenCalledOnce()
  })

  it("logs error but does not rethrow when stop() fails", async () => {
    vi.resetModules()

    const mockStop = vi.fn().mockRejectedValue(new Error("network timeout"))
    const mockCreate = vi.fn().mockResolvedValue({ getUri: vi.fn().mockReturnValue("mongodb://localhost/test"), stop: mockStop })
    const mockDisconnect = vi.fn().mockResolvedValue(undefined)

    vi.doMock("mongodb-memory-server", () => ({
      MongoMemoryServer: { create: mockCreate },
    }))
    vi.doMock("mongoose", () => ({
      default: { connect: vi.fn().mockResolvedValue(undefined), disconnect: mockDisconnect },
    }))

    const { setup, teardown } = await import("@/test-helpers/db-global-setup")
    await setup()

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(teardown()).resolves.toBeUndefined()
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to stop mongodb-memory-server:",
      expect.any(Error),
    )
  })
})
