import { describe, it, expect } from "vitest"
import { getDomainRedirectUrl } from "@/lib/domain-redirect"

describe("getDomainRedirectUrl", () => {
  const PRIMARY_URL = "https://recipe.dougis.com"

  it("returns redirect URL when Host differs from primary", () => {
    const req = new Request("http://cookbook-tanstack.fly.dev/recipes/123", {
      headers: { host: "cookbook-tanstack.fly.dev" },
    })
    expect(getDomainRedirectUrl(req, PRIMARY_URL)).toBe(
      "https://recipe.dougis.com/recipes/123",
    )
  })

  it("preserves query string on redirect", () => {
    const req = new Request(
      "http://cookbook-tanstack.fly.dev/search?q=pasta&page=2",
      { headers: { host: "cookbook-tanstack.fly.dev" } },
    )
    expect(getDomainRedirectUrl(req, PRIMARY_URL)).toBe(
      "https://recipe.dougis.com/search?q=pasta&page=2",
    )
  })

  it("returns null when Host matches primary (pass through)", () => {
    const req = new Request("https://recipe.dougis.com/recipes/123", {
      headers: { host: "recipe.dougis.com" },
    })
    expect(getDomainRedirectUrl(req, PRIMARY_URL)).toBeNull()
  })

  it("returns null when no Host header (internal request pass through)", () => {
    const req = new Request("http://cookbook-tanstack.fly.dev/recipes/123")
    expect(getDomainRedirectUrl(req, PRIMARY_URL)).toBeNull()
  })

  it("returns null when APP_PRIMARY_URL is undefined (local dev pass through)", () => {
    const req = new Request("http://cookbook-tanstack.fly.dev/recipes/123", {
      headers: { host: "cookbook-tanstack.fly.dev" },
    })
    expect(getDomainRedirectUrl(req, undefined)).toBeNull()
  })

  it("returns null when APP_PRIMARY_URL is empty string", () => {
    const req = new Request("http://cookbook-tanstack.fly.dev/recipes/123", {
      headers: { host: "cookbook-tanstack.fly.dev" },
    })
    expect(getDomainRedirectUrl(req, "")).toBeNull()
  })

  it("returns null when APP_PRIMARY_URL is malformed (no crash)", () => {
    const req = new Request("http://cookbook-tanstack.fly.dev/recipes/123", {
      headers: { host: "cookbook-tanstack.fly.dev" },
    })
    expect(() => getDomainRedirectUrl(req, "not-a-url")).not.toThrow()
    expect(getDomainRedirectUrl(req, "not-a-url")).toBeNull()
  })

  it("redirect Location uses APP_PRIMARY_URL scheme (not request scheme)", () => {
    const req = new Request("http://cookbook-tanstack.fly.dev/recipes", {
      headers: { host: "cookbook-tanstack.fly.dev" },
    })
    const result = getDomainRedirectUrl(req, PRIMARY_URL)
    expect(result).toMatch(/^https:\/\/recipe\.dougis\.com/)
  })

  it("uses URL origin so trailing slash in APP_PRIMARY_URL does not double-slash", () => {
    const req = new Request("http://cookbook-tanstack.fly.dev/recipes", {
      headers: { host: "cookbook-tanstack.fly.dev" },
    })
    expect(getDomainRedirectUrl(req, "https://recipe.dougis.com/")).toBe(
      "https://recipe.dougis.com/recipes",
    )
  })

  it("uses URL origin so APP_PRIMARY_URL path component is ignored", () => {
    const req = new Request("http://cookbook-tanstack.fly.dev/recipes", {
      headers: { host: "cookbook-tanstack.fly.dev" },
    })
    expect(getDomainRedirectUrl(req, "https://recipe.dougis.com/app")).toBe(
      "https://recipe.dougis.com/recipes",
    )
  })

  it("hostname comparison is case-insensitive (RFC 4343)", () => {
    const req = new Request("http://Recipe.Dougis.Com/recipes", {
      headers: { host: "Recipe.Dougis.Com" },
    })
    expect(getDomainRedirectUrl(req, PRIMARY_URL)).toBeNull()
  })

  it("correctly redirects root path with query string", () => {
    const req = new Request("http://cookbook-tanstack.fly.dev/?ref=email", {
      headers: { host: "cookbook-tanstack.fly.dev" },
    })
    expect(getDomainRedirectUrl(req, PRIMARY_URL)).toBe(
      "https://recipe.dougis.com/?ref=email",
    )
  })

  it("returns null for IPv4 host — health check pass through", () => {
    const req = new Request("http://1.2.3.4/", { headers: { host: "1.2.3.4" } })
    expect(getDomainRedirectUrl(req, PRIMARY_URL)).toBeNull()
  })

  it("returns null for IPv4 host with port — health check pass through", () => {
    const req = new Request("http://127.0.0.1:3000/", {
      headers: { host: "127.0.0.1:3000" },
    })
    expect(getDomainRedirectUrl(req, PRIMARY_URL)).toBeNull()
  })

  it("returns null for IPv6 loopback host (pass through)", () => {
    const req = new Request("http://[::1]:3000/recipes", {
      headers: { host: "[::1]:3000" },
    })
    expect(() => getDomainRedirectUrl(req, PRIMARY_URL)).not.toThrow()
    expect(getDomainRedirectUrl(req, PRIMARY_URL)).toBeNull()
  })

  it("returns null for bracketed IPv6 fly internal host — health check pass through", () => {
    const req = new Request("http://[fdaa:1e:bb7b:a7b:652:ebdb:c00e:2]:3000/", {
      headers: { host: "[fdaa:1e:bb7b:a7b:652:ebdb:c00e:2]:3000" },
    })
    expect(getDomainRedirectUrl(req, PRIMARY_URL)).toBeNull()
  })

  it("returns null when Host header is malformed (no crash)", () => {
    const req = new Request("http://cookbook-tanstack.fly.dev/recipes", {
      headers: { host: "not a valid host!!!" },
    })
    expect(() => getDomainRedirectUrl(req, PRIMARY_URL)).not.toThrow()
    expect(getDomainRedirectUrl(req, PRIMARY_URL)).toBeNull()
  })
})
