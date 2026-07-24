import { verifyAccessToken } from "better-auth/oauth2";

/** OAuth scope required for the Alexa adapter to read a linked user's own content. */
export const ALEXA_READ_SCOPE = "read:own-content";

function baseUrl(): string {
  const url = process.env.BETTER_AUTH_URL;
  if (!url) {
    throw new Error("BETTER_AUTH_URL is not set");
  }
  return url;
}

/**
 * Validates an OAuth access token presented by the Alexa skill and returns the
 * linked user's id, or null if the token is missing, expired, revoked, or lacks
 * the read:own-content scope.
 */
export async function validateAlexaAccessToken(
  token: string | undefined | null,
): Promise<{ userId: string } | null> {
  if (!token) return null;

  const base = baseUrl();
  try {
    const payload = await verifyAccessToken(token, {
      verifyOptions: { audience: base, issuer: base },
      scopes: [ALEXA_READ_SCOPE],
      jwksUrl: `${base}/api/auth/jwks`,
    });
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    return userId ? { userId } : null;
  } catch {
    return null;
  }
}
