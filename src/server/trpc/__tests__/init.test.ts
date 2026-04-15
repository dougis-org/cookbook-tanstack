import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }))

const anonCtx = { session: null, user: null }
const authCtx = { session: { id: "s1" } as never, user: { id: "u1" } as never }

function makeUserCtx(tier: string | undefined, isAdmin: boolean) {
  return {
    session: { id: "s1" } as never,
    user: { id: "u1", tier, isAdmin } as never,
  }
}

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

describe("tierProcedure()", () => {
  it("executes procedure when user meets required tier", async () => {
    const { router, tierProcedure } = await import("@/server/trpc/init")
    const testRouter = router({
      premium: tierProcedure("sous-chef").query(() => "premium-data"),
    })

    const result = await testRouter
      .createCaller(makeUserCtx("executive-chef", false))
      .premium()
    expect(result).toBe("premium-data")
  })

  it("throws FORBIDDEN when user tier is insufficient", async () => {
    const { router, tierProcedure } = await import("@/server/trpc/init")
    const testRouter = router({
      premium: tierProcedure("sous-chef").query(() => "premium-data"),
    })

    await expect(
      testRouter.createCaller(makeUserCtx("home-cook", false)).premium(),
    ).rejects.toThrow("FORBIDDEN")
  })

  it("allows admin user regardless of tier (admin bypass)", async () => {
    const { router, tierProcedure } = await import("@/server/trpc/init")
    const testRouter = router({
      premium: tierProcedure("executive-chef").query(() => "admin-data"),
    })

    const result = await testRouter
      .createCaller(makeUserCtx("home-cook", true))
      .premium()
    expect(result).toBe("admin-data")
  })

  it("throws UNAUTHORIZED for unauthenticated call", async () => {
    const { router, tierProcedure } = await import("@/server/trpc/init")
    const testRouter = router({
      premium: tierProcedure("prep-cook").query(() => "data"),
    })

    await expect(testRouter.createCaller(anonCtx).premium()).rejects.toThrow("UNAUTHORIZED")
  })

  it("throws FORBIDDEN for undefined tier against elevated requirement", async () => {
    const { router, tierProcedure } = await import("@/server/trpc/init")
    const testRouter = router({
      premium: tierProcedure("prep-cook").query(() => "data"),
    })

    await expect(
      testRouter.createCaller(makeUserCtx(undefined, false)).premium(),
    ).rejects.toThrow("FORBIDDEN")
  })
})

describe("adminProcedure", () => {
  it("executes procedure for admin user", async () => {
    const { router, adminProcedure } = await import("@/server/trpc/init")
    const testRouter = router({
      admin: adminProcedure.query(() => "admin-only"),
    })

    const result = await testRouter
      .createCaller(makeUserCtx("home-cook", true))
      .admin()
    expect(result).toBe("admin-only")
  })

  it("throws FORBIDDEN for non-admin user", async () => {
    const { router, adminProcedure } = await import("@/server/trpc/init")
    const testRouter = router({
      admin: adminProcedure.query(() => "admin-only"),
    })

    await expect(
      testRouter.createCaller(makeUserCtx("executive-chef", false)).admin(),
    ).rejects.toThrow("FORBIDDEN")
  })
})
