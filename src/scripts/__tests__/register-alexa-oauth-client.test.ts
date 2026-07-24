import { describe, it, expect } from "vitest";
import { buildCreateClientRequest } from "../register-alexa-oauth-client";

describe("buildCreateClientRequest", () => {
  it("targets the create-client endpoint with the admin session cookie and requested redirect_uris", () => {
    const { url, init } = buildCreateClientRequest(
      "https://cookbook.example.com",
      "session-token-abc",
      ["https://layla.amazon.com/api/skill/link/XYZ"],
    );

    expect(url).toBe("https://cookbook.example.com/api/auth/oauth2/create-client");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).cookie).toBe(
      "better-auth.session_token=session-token-abc",
    );
    expect(JSON.parse(init.body as string)).toMatchObject({
      redirect_uris: ["https://layla.amazon.com/api/skill/link/XYZ"],
      scope: "read:own-content",
    });
  });
});
