// @vitest-environment node
/**
 * Integration test: the real Better-Auth updateUser path must reject invalid
 * print placement values (validator.input) and write nothing.
 */
import { describe, it, expect, vi, beforeAll } from "vitest"

vi.mock("better-auth/tanstack-start", () => ({
  tanstackStartCookies: () => ({ id: "tanstack-start-cookies-stub" }),
}))
vi.mock("@/lib/mail", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }))

import { getBetterAuthCollection } from "@/db"
import { PRINT_PLACEMENT_KEYS, PRINT_PLACEMENTS } from "@/lib/printPreferences"

// auth captures the Mongo client at import time, so import it only after the
// shared setup file has connected the worker database.
let auth: (typeof import("@/lib/auth"))["auth"]
let headers: Headers
let email: string

async function storedUser() {
  return getBetterAuthCollection("user").findOne({ email })
}

beforeAll(async () => {
  auth = (await import("@/lib/auth")).auth
  email = `placement-${Date.now()}@recipe.test`
  const res = await auth.api.signUpEmail({
    body: { email, password: "password-1234", name: "Placement Tester" },
    returnHeaders: true,
  })
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ")
  headers = new Headers({ cookie })
})

describe("print placement server-side validation", () => {
  it("stores new-account defaults", async () => {
    const user = await storedUser()
    expect(user?.printCategory).toBe("footer")
    expect(user?.printDifficulty).toBe("none")
  })

  it.each(PRINT_PLACEMENT_KEYS)("accepts every allowed value for %s", async (key) => {
    for (const value of PRINT_PLACEMENTS) {
      await auth.api.updateUser({ body: { [key]: value }, headers })
      expect((await storedUser())?.[key]).toBe(value)
    }
  })

  it.each(PRINT_PLACEMENT_KEYS)("rejects an out-of-range string for %s and writes nothing", async (key) => {
    await auth.api.updateUser({ body: { [key]: "footer" }, headers })
    await expect(auth.api.updateUser({ body: { [key]: "sideways" }, headers })).rejects.toThrow()
    expect((await storedUser())?.[key]).toBe("footer")
  })

  it.each([7, null, {}, true, ["header"]])("rejects non-string value %j and writes nothing", async (bad) => {
    await auth.api.updateUser({ body: { printCategory: "footer" }, headers })
    await expect(auth.api.updateUser({ body: { printCategory: bad as never }, headers })).rejects.toThrow()
    expect((await storedUser())?.printCategory).toBe("footer")
  })

  it("writes nothing from a mixed payload containing one invalid placement", async () => {
    await auth.api.updateUser({ body: { printCategory: "footer", theme: "dark" }, headers })
    await expect(
      auth.api.updateUser({ body: { theme: "light-warm", printCategory: "header", printServings: "bogus" }, headers }),
    ).rejects.toThrow()
    const user = await storedUser()
    expect(user?.theme).toBe("dark")
    expect(user?.printCategory).toBe("footer")
  })
})
