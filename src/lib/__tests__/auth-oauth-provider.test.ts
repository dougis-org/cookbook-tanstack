import { describe, it, expect } from "vitest"

const mockDb = () => ({})

vi.mock("@/db", () => ({
  getMongoClient: vi.fn(() => ({ db: mockDb })),
}))

vi.mock("@/lib/mail", () => ({
  sendEmail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
}))

import { vi } from "vitest"

/**
 * These verify our oauth-provider wiring (scopes, consent/login pages, and that
 * the plugin's /authorize and /token endpoints are mounted). PKCE validation,
 * code replay/expiry rejection, and token issuance correctness are the
 * plugin's own tested responsibility (see design.md Decision 3) — not
 * re-verified here.
 */
describe("auth oauth-provider wiring", () => {
  it("exposes the /oauth2/authorize and /oauth2/token endpoints", async () => {
    const { auth } = await import("@/lib/auth")
    expect(typeof auth.api.oauth2Authorize).toBe("function")
    expect(typeof auth.api.oauth2Token).toBe("function")
  })

  it("exposes the /oauth2/consent endpoint used by the consent page", async () => {
    const { auth } = await import("@/lib/auth")
    expect(typeof auth.api.oauth2Consent).toBe("function")
  })

  it("exposes createOAuthClient for registering the Alexa skill as a client", async () => {
    const { auth } = await import("@/lib/auth")
    expect(typeof auth.api.createOAuthClient).toBe("function")
  })

  it("registers read:own-content among the supported scopes", async () => {
    const { auth } = await import("@/lib/auth")
    const oauthPlugin = auth.options.plugins?.find(
      (p: { id: string }) => p.id === "oauth-provider",
    ) as { options?: { scopes?: string[] } } | undefined
    expect(oauthPlugin?.options?.scopes).toContain("read:own-content")
  })

  it("configures the consent and login pages the plugin redirects to", async () => {
    const { auth } = await import("@/lib/auth")
    const oauthPlugin = auth.options.plugins?.find(
      (p: { id: string }) => p.id === "oauth-provider",
    ) as { options?: { consentPage?: string; loginPage?: string } } | undefined
    expect(oauthPlugin?.options?.consentPage).toBe("/oauth/consent")
    expect(oauthPlugin?.options?.loginPage).toBe("/auth/login")
  })

  it("registers the jwt plugin required for access/ID tokens", async () => {
    const { auth } = await import("@/lib/auth")
    const jwtPlugin = auth.options.plugins?.find((p: { id: string }) => p.id === "jwt")
    expect(jwtPlugin).toBeDefined()
  })
})
