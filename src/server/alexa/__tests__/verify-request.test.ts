// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { verifyAlexaRequest, verifyAlexaSkillId } from "../verify-request";

const VALID_CERT_URL =
  "https://s3.amazonaws.com/echo.api/echo-api-cert-6-ats.pem";

function buildEnvelope(timestamp: string) {
  return JSON.stringify({
    request: { type: "IntentRequest", timestamp },
  });
}

describe("verifyAlexaRequest", () => {
  it("rejects a request with a missing signature header", async () => {
    const headers = new Headers({ signaturecertchainurl: VALID_CERT_URL });
    await expect(
      verifyAlexaRequest(buildEnvelope(new Date().toISOString()), headers),
    ).rejects.toThrow();
  });

  it("rejects a request with a missing certificate chain URL header", async () => {
    const headers = new Headers({ signature: "some-signature" });
    await expect(
      verifyAlexaRequest(buildEnvelope(new Date().toISOString()), headers),
    ).rejects.toThrow();
  });

  it("rejects a request with an invalid signature, verified against the raw request body", async () => {
    // A well-formed but bogus cert chain URL/signature pair — the raw body
    // text is passed through unmodified, but the signature can't validate
    // against it, so verification must fail rather than silently pass.
    const headers = new Headers({
      signaturecertchainurl: VALID_CERT_URL,
      signature: Buffer.from("not-a-real-signature").toString("base64"),
    });
    await expect(
      verifyAlexaRequest(buildEnvelope(new Date().toISOString()), headers),
    ).rejects.toThrow();
  }, 15000);

  it("rejects a request with a stale timestamp", async () => {
    const staleTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const headers = new Headers({
      signaturecertchainurl: VALID_CERT_URL,
      signature: Buffer.from("not-a-real-signature").toString("base64"),
    });
    await expect(
      verifyAlexaRequest(buildEnvelope(staleTimestamp), headers),
    ).rejects.toThrow();
  }, 15000);
});

describe("verifyAlexaSkillId", () => {
  const ORIGINAL_SKILL_ID = process.env.ALEXA_SKILL_ID;

  beforeEach(() => {
    process.env.ALEXA_SKILL_ID = "amzn1.ask.skill.my-real-skill";
  });

  afterEach(() => {
    if (ORIGINAL_SKILL_ID === undefined) delete process.env.ALEXA_SKILL_ID;
    else process.env.ALEXA_SKILL_ID = ORIGINAL_SKILL_ID;
  });

  function envelopeWithAppId(applicationId: string | undefined) {
    return {
      context: { System: { application: { applicationId } } },
    } as never;
  }

  it("accepts a request whose application ID matches this skill", () => {
    expect(() =>
      verifyAlexaSkillId(envelopeWithAppId("amzn1.ask.skill.my-real-skill")),
    ).not.toThrow();
  });

  it("rejects a request from a different (attacker-controlled) skill", () => {
    expect(() =>
      verifyAlexaSkillId(envelopeWithAppId("amzn1.ask.skill.someone-elses-skill")),
    ).toThrow();
  });

  it("rejects a request with no application ID at all", () => {
    expect(() => verifyAlexaSkillId(envelopeWithAppId(undefined))).toThrow();
  });

  it("fails closed when ALEXA_SKILL_ID is not configured", () => {
    delete process.env.ALEXA_SKILL_ID;
    expect(() =>
      verifyAlexaSkillId(envelopeWithAppId("amzn1.ask.skill.my-real-skill")),
    ).toThrow();
  });
});
