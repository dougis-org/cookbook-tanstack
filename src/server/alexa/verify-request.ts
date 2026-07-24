import { SkillRequestSignatureVerifier, TimestampVerifier } from "ask-sdk-express-adapter";
import type { IncomingHttpHeaders } from "http";

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
