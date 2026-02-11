import { describe, it, expect } from "vitest"
import { authClient, useSession, signIn, signUp, signOut } from "@/lib/auth-client"

describe("auth client", () => {
  it("exports an authClient instance", () => {
    expect(authClient).toBeDefined()
  })

  it("exports useSession hook", () => {
    expect(useSession).toBeDefined()
    expect(typeof useSession).toBe("function")
  })

  it("exports signIn methods", () => {
    expect(signIn).toBeDefined()
    expect(signIn.email).toBeDefined()
    expect(typeof signIn.email).toBe("function")
  })

  it("exports signUp methods", () => {
    expect(signUp).toBeDefined()
    expect(signUp.email).toBeDefined()
    expect(typeof signUp.email).toBe("function")
  })

  it("exports signOut method", () => {
    expect(signOut).toBeDefined()
    expect(typeof signOut).toBe("function")
  })

  it("has username plugin enabled", () => {
    expect(signIn.username).toBeDefined()
    expect(typeof signIn.username).toBe("function")
  })
})
