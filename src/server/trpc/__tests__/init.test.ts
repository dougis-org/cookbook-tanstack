import { describe, it, expect, vi } from "vitest"

vi.mock("@/db", () => ({
  db: {},
}))

vi.mock("@/db/schema", () => ({
  users: {},
  sessions: {},
  accounts: {},
  verifications: {},
}))

describe("tRPC init", () => {
  it("exports router, publicProcedure, and protectedProcedure", async () => {
    const { router, publicProcedure, protectedProcedure } = await import(
      "@/server/trpc/init"
    )
    expect(router).toBeDefined()
    expect(publicProcedure).toBeDefined()
    expect(protectedProcedure).toBeDefined()
  })

  it("protectedProcedure rejects calls without a session", async () => {
    const { router, protectedProcedure } = await import(
      "@/server/trpc/init"
    )
    const testRouter = router({
      secret: protectedProcedure.query(() => "secret-data"),
    })

    const caller = testRouter.createCaller({
      db: {} as never,
      session: null,
      user: null,
    })

    await expect(caller.secret()).rejects.toThrow("UNAUTHORIZED")
  })

  it("protectedProcedure allows calls with a valid session", async () => {
    const { router, protectedProcedure } = await import(
      "@/server/trpc/init"
    )
    const testRouter = router({
      secret: protectedProcedure.query(() => "secret-data"),
    })

    const caller = testRouter.createCaller({
      db: {} as never,
      session: { id: "session-1" } as never,
      user: { id: "user-1" } as never,
    })

    const result = await caller.secret()
    expect(result).toBe("secret-data")
  })

  it("publicProcedure allows unauthenticated calls", async () => {
    const { router, publicProcedure } = await import("@/server/trpc/init")
    const testRouter = router({
      greeting: publicProcedure.query(() => "hello"),
    })

    const caller = testRouter.createCaller({
      db: {} as never,
      session: null,
      user: null,
    })

    const result = await caller.greeting()
    expect(result).toBe("hello")
  })
})
