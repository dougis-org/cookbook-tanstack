import { TRPCError } from "@trpc/server"
import { describe, it, expect } from "vitest"
import { verifiedProcedure, router } from "../init"

describe("verifiedProcedure", () => {
  const appRouter = router({
    test: verifiedProcedure.query(() => ({ ok: true })),
  })

  it("allows verified users", async () => {
    const caller = appRouter.createCaller({
      user: { id: "u1", emailVerified: true } as any,
      session: { id: "s1" } as any,
    })
    const res = await caller.test()
    expect(res.ok).toBe(true)
  })

  it("allows legacy users (undefined emailVerified)", async () => {
    const caller = appRouter.createCaller({
      user: { id: "u1", emailVerified: undefined } as any,
      session: { id: "s1" } as any,
    })
    const res = await caller.test()
    expect(res.ok).toBe(true)
  })

  it("throws FORBIDDEN with appError for unverified users", async () => {
    const caller = appRouter.createCaller({
      user: { id: "u1", emailVerified: false } as any,
      session: { id: "s1" } as any,
    })
    try {
      await caller.test()
      throw new Error("Should have thrown")
    } catch (e: any) {
      expect(e).toBeInstanceOf(TRPCError)
      expect(e.code).toBe("FORBIDDEN")
      expect(e.cause?.type).toBe("email-not-verified")
    }
  })
})
