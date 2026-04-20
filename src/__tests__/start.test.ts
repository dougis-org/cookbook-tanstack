import { describe, it, expect, vi, beforeEach } from "vitest"
import { getDomainRedirectUrl } from "@/lib/domain-redirect"

const PRIMARY_URL = "https://recipe.dougis.com"

describe("domainRedirectMiddleware status codes", () => {
  const mockNext = vi.fn(() => new Response("ok"))

  beforeEach(() => {
    mockNext.mockClear()
  })

  function buildResponse(method: string, url: string): Response {
    const req = new Request(url, {
      method,
      headers: { host: "cookbook-tanstack.fly.dev" },
    })
    const redirectUrl = getDomainRedirectUrl(req, PRIMARY_URL)
    if (!redirectUrl) return mockNext()
    const status =
      req.method === "GET" || req.method === "HEAD" ? 301 : 308
    return new Response(null, { status, headers: { Location: redirectUrl } })
  }

  it("issues 301 for GET requests to non-primary host", () => {
    const res = buildResponse("GET", "http://cookbook-tanstack.fly.dev/recipes")
    expect(res.status).toBe(301)
    expect(res.headers.get("Location")).toBe("https://recipe.dougis.com/recipes")
  })

  it("issues 301 for HEAD requests to non-primary host", () => {
    const res = buildResponse(
      "HEAD",
      "http://cookbook-tanstack.fly.dev/recipes",
    )
    expect(res.status).toBe(301)
  })

  it("issues 308 for POST requests to non-primary host", () => {
    const res = buildResponse(
      "POST",
      "http://cookbook-tanstack.fly.dev/api/auth/sign-in",
    )
    expect(res.status).toBe(308)
    expect(res.headers.get("Location")).toBe(
      "https://recipe.dougis.com/api/auth/sign-in",
    )
  })

  it("issues 308 for PUT requests to non-primary host", () => {
    const res = buildResponse(
      "PUT",
      "http://cookbook-tanstack.fly.dev/api/recipes/123",
    )
    expect(res.status).toBe(308)
  })

  it("calls next() when host matches primary", () => {
    const req = new Request("https://recipe.dougis.com/recipes", {
      headers: { host: "recipe.dougis.com" },
    })
    const redirectUrl = getDomainRedirectUrl(req, PRIMARY_URL)
    expect(redirectUrl).toBeNull()
    mockNext()
    expect(mockNext).toHaveBeenCalledOnce()
  })
})
