// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const { verifyAccessToken } = vi.hoisted(() => ({ verifyAccessToken: vi.fn() }));
vi.mock("better-auth/oauth2", () => ({ verifyAccessToken }));

import { validateAlexaAccessToken, ALEXA_READ_SCOPE } from "../token-validation";

describe("validateAlexaAccessToken", () => {
  beforeEach(() => {
    verifyAccessToken.mockReset();
    process.env.BETTER_AUTH_URL = "https://cookbook.test";
  });

  it("returns null when no token is presented", async () => {
    const result = await validateAlexaAccessToken(undefined);
    expect(result).toBeNull();
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it("returns the linked user id for a valid, unexpired token with the required scope", async () => {
    verifyAccessToken.mockResolvedValue({ sub: "user-123" });

    const result = await validateAlexaAccessToken("valid-token");

    expect(result).toEqual({ userId: "user-123" });
    expect(verifyAccessToken).toHaveBeenCalledWith(
      "valid-token",
      expect.objectContaining({
        scopes: [ALEXA_READ_SCOPE],
        jwksUrl: "https://cookbook.test/api/auth/jwks",
        verifyOptions: { audience: "https://cookbook.test", issuer: "https://cookbook.test" },
      }),
    );
  });

  it("returns null for an expired access token", async () => {
    verifyAccessToken.mockRejectedValue(new Error("token expired"));

    const result = await validateAlexaAccessToken("expired-token");

    expect(result).toBeNull();
  });

  it("returns null for a revoked access token", async () => {
    verifyAccessToken.mockRejectedValue(new Error("token revoked"));

    const result = await validateAlexaAccessToken("revoked-token");

    expect(result).toBeNull();
  });
});
