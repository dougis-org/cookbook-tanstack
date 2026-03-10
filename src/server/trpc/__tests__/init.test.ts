import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

const anonCtx = { session: null, user: null }
const authCtx = { session: { id: "s1" } as never, user: { id: "u1" } as never }

describe("tRPC init", () => {
  it("exports router, publicProcedure, and protectedProcedure", async () => {
    const { router, publicProcedure, protectedProcedure } = await import("@/server/trpc/init")
    expect(router).toBeDefined()
    expect(publicProcedure).toBeDefined()
    expect(protectedProcedure).toBeDefined()
  })

  it("protectedProcedure rejects calls without a session", async () => {
    const { router, protectedProcedure } = await import("@/server/trpc/init")
    const testRouter = router({ secret: protectedProcedure.query(() => "secret-data") })

    await expect(testRouter.createCaller(anonCtx).secret()).rejects.toThrow("UNAUTHORIZED")
  })

  it("protectedProcedure allows calls with a valid session", async () => {
    const { router, protectedProcedure } = await import("@/server/trpc/init")
    const testRouter = router({ secret: protectedProcedure.query(() => "secret-data") })

    expect(await testRouter.createCaller(authCtx).secret()).toBe("secret-data")
  })

  it("publicProcedure allows unauthenticated calls", async () => {
    const { router, publicProcedure } = await import("@/server/trpc/init")
    const testRouter = router({ greeting: publicProcedure.query(() => "hello") })

    expect(await testRouter.createCaller(anonCtx).greeting()).toBe("hello")
  })
})
