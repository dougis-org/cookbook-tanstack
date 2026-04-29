import { describe, it, expect } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

import { vi } from "vitest"

describe("extractAppError", () => {
  it("promotes tier-wall cause to AppErrorCause", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    const cause = { type: "tier-wall" as const, reason: "count-limit" as const }
    expect(extractAppError(cause)).toEqual(cause)
  })

  it("promotes tier-wall cause with private-content reason", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    const cause = { type: "tier-wall" as const, reason: "private-content" as const }
    expect(extractAppError(cause)).toEqual(cause)
  })

  it("promotes tier-wall cause with import reason", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    const cause = { type: "tier-wall" as const, reason: "import" as const }
    expect(extractAppError(cause)).toEqual(cause)
  })

  it("returns null when cause is absent", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    expect(extractAppError(undefined)).toBeNull()
  })

  it("returns null when cause is a string", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    expect(extractAppError("some string")).toBeNull()
  })

  it("returns null when cause is an Error instance", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    expect(extractAppError(new Error("something"))).toBeNull()
  })

  it("returns null when cause is a plain object with unknown type", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    expect(extractAppError({ type: "unknown-type", reason: "foo" })).toBeNull()
  })

  it("returns null when cause is a plain object with tier-wall but unknown reason", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    expect(extractAppError({ type: "tier-wall", reason: "unknown-reason" })).toBeNull()
  })

  it("promotes ownership type to AppErrorCause", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    // ownership is a valid AppErrorCause type and should be forwarded as-is
    const cause = { type: "ownership" as const }
    expect(extractAppError(cause)).toEqual({ type: "ownership" })
  })

  it("does not throw on null cause", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    expect(() => extractAppError(null)).not.toThrow()
    expect(extractAppError(null)).toBeNull()
  })
})
