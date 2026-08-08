import { SkillRequestSignatureVerifier, TimestampVerifier } from "ask-sdk-express-adapter";
import type { IncomingHttpHeaders } from "http";
import type { RequestEnvelope } from "ask-sdk-model";

/**
 * Verifies an incoming Alexa skill request against its raw body and headers.
 *
 * Uses `ask-sdk-express-adapter`'s verifier classes directly rather than its
 * Express-bound adapter: `SkillRequestSignatureVerifier`/`TimestampVerifier`
 * operate on a plain body string + header map (design.md's Decision 1 open
 * question resolves here — no Express/h3 body-parsing plumbing is needed,
 * since the route handler already receives a Fetch API `Request` whose body
 * hasn't been consumed by anything else, and `request.text()` gives back the
 * exact raw bytes Alexa signed).
 *
 * Throws if the signature is missing/invalid or the timestamp is stale.
 */
export async function verifyAlexaRequest(rawBody: string, headers: Headers): Promise<void> {
  const headerMap: IncomingHttpHeaders = {};
  headers.forEach((value, key) => {
    headerMap[key.toLowerCase()] = value;
  });

  await new SkillRequestSignatureVerifier().verify(rawBody, headerMap);
  await new TimestampVerifier().verify(rawBody);
}

/**
 * Verifies the request's `applicationId` matches this deployment's own skill.
 *
 * Signature/timestamp verification alone only proves a request came from
 * genuine Alexa infrastructure — it does NOT prove the request is for *this*
 * skill. Per Amazon's self-hosted-endpoint security requirements
 * (https://developer.amazon.com/docs/custom-skills/host-a-custom-skill-as-a-web-service.html#checking-the-signature-of-the-request,
 * step 3), the endpoint must additionally check the application ID: anyone
 * can register their own free Alexa skill, point its endpoint at this route,
 * and have Alexa deliver genuinely-signed requests for *their* skill — this
 * check rejects those cross-skill requests.
 *
 * Fails closed: if `ALEXA_SKILL_ID` isn't configured, every request is
 * rejected rather than silently skipping the check.
 */
export function verifyAlexaSkillId(requestEnvelope: RequestEnvelope): void {
  const expected = process.env.ALEXA_SKILL_ID;
  if (!expected) {
    throw new Error("ALEXA_SKILL_ID is not configured");
  }
  const actual =
    requestEnvelope.context?.System?.application?.applicationId ??
    requestEnvelope.session?.application?.applicationId;
  if (actual !== expected) {
    throw new Error("Request application ID does not match this skill");
  }
}
