import { describe, it, expect } from "vitest";
import { parseConsentRequest, buildConsentDecisionBody } from "../oauth-consent";

describe("parseConsentRequest", () => {
  it("extracts client_id, scope, and oauth_query from search params", () => {
    const result = parseConsentRequest({
      client_id: "alexa-skill",
      scope: "read:own-content",
      oauth_query: "signed-blob",
    });
    expect(result).toEqual({
      clientId: "alexa-skill",
      scope: "read:own-content",
      oauthQuery: "signed-blob",
    });
  });

  it("returns nulls for missing or non-string params", () => {
    const result = parseConsentRequest({ client_id: 42 });
    expect(result).toEqual({ clientId: null, scope: null, oauthQuery: null });
  });
});

describe("buildConsentDecisionBody", () => {
  const request = { clientId: "alexa-skill", scope: "read:own-content", oauthQuery: "signed-blob" };

  it("records a grant decision distinctly from a deny decision", () => {
    expect(buildConsentDecisionBody("accept", request).accept).toBe(true);
    expect(buildConsentDecisionBody("deny", request).accept).toBe(false);
  });

  it("includes scope and oauth_query when present", () => {
    const body = buildConsentDecisionBody("accept", request);
    expect(body).toEqual({ accept: true, scope: "read:own-content", oauth_query: "signed-blob" });
  });

  it("omits scope and oauth_query when absent", () => {
    const body = buildConsentDecisionBody("deny", { clientId: null, scope: null, oauthQuery: null });
    expect(body).toEqual({ accept: false });
  });
});
