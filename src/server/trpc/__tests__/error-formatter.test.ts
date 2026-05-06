import { describe, it, expect, vi } from "vitest"
import { TRPCError, initTRPC } from "@trpc/server"
import superjson from "superjson"

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

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

  it("promotes an Error instance with app error properties (e.g. tRPC UnknownCauseError)", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    const cause = Object.assign(new Error("wrapped"), { type: "tier-wall", reason: "count-limit" })
    expect(extractAppError(cause)).toEqual({ type: "tier-wall", reason: "count-limit" })
  })

  it("returns null when cause is an Error instance without properties", async () => {
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

  it("promotes email-not-verified type to AppErrorCause", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    const cause = { type: "email-not-verified" as const }
    expect(extractAppError(cause)).toEqual({ type: "email-not-verified" })
  })

  it("does not throw on null cause", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    expect(() => extractAppError(null)).not.toThrow()
    expect(extractAppError(null)).toBeNull()
  })
})

describe("errorFormatter integration", () => {
  it("promotes appError cause to the response shape", async () => {
    const { extractAppError } = await import("@/server/trpc/init")
    
    // Create a minimal tRPC instance with the same formatter logic
    const t = initTRPC.create({
      transformer: superjson,
      errorFormatter({ shape, error }) {
        return {
          ...shape,
          data: {
            ...shape.data,
            appError: extractAppError(error.cause),
          },
        }
      },
    })

    const router = t.router({
      test: t.procedure.query(() => {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          cause: { type: "tier-wall", reason: "count-limit" },
        })
      }),
    })

    const caller = router.createCaller({})
    
    try {
      await caller.test()
      throw new Error("Should have thrown")
    } catch (e: any) {
      const error = e as TRPCError
      // The caller returns the raw error, but we want to verify what the formatter would do.
      // We can manually invoke the formatter defined in the tRPC config.
      
      const { errorFormatter } = (t as any)._config
      const shape = errorFormatter({
        shape: { message: error.message, code: -32603, data: { code: error.code, httpStatus: 402 } },
        error,
        type: "query",
        path: "test",
        input: undefined,
        ctx: {},
      })
      
      expect(shape.data).toHaveProperty("appError")
      expect(shape.data.appError).toEqual({
        type: "tier-wall",
        reason: "count-limit",
      })
    }
  })
})
