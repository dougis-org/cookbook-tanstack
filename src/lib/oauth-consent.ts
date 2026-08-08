/**
 * Shared logic for the `/oauth/consent` page. Kept separate from the route
 * component so the parsing/decision-building logic is unit-testable without
 * mounting the full route tree.
 */

export interface ConsentRequest {
  clientId: string | null
  scope: string | null
  oauthQuery: string | null
}

/** Parses the client_id/scope/oauth_query params better-auth's oauth-provider redirects to the consent page with. */
export function parseConsentRequest(search: Record<string, unknown>): ConsentRequest {
  return {
    clientId: typeof search.client_id === 'string' ? search.client_id : null,
    scope: typeof search.scope === 'string' ? search.scope : null,
    oauthQuery: typeof search.oauth_query === 'string' ? search.oauth_query : null,
  }
}

/** Builds the request body for POST /api/auth/oauth2/consent, recording accept vs. deny distinctly. */
export function buildConsentDecisionBody(
  decision: 'accept' | 'deny',
  request: ConsentRequest,
): { accept: boolean; scope?: string; oauth_query?: string } {
  return {
    accept: decision === 'accept',
    ...(request.scope ? { scope: request.scope } : {}),
    ...(request.oauthQuery ? { oauth_query: request.oauthQuery } : {}),
  }
}

/**
 * Validates a post-consent redirect target before the page navigates to it.
 *
 * The oauth-provider plugin's own `/oauth2/consent` endpoint is the thing
 * that validates `redirect_uri` against the registered client's allowlist
 * (design.md Decision 3) — this redirect is expected to be an external URL
 * (e.g. Alexa's `layla.amazon.com` linking callback), so it can't be
 * restricted to our own origin. What this check *can* enforce client-side:
 * reject anything that isn't a well-formed http(s) URL, so a malformed or
 * script-scheme value (e.g. `javascript:`) in an unexpected/compromised
 * response body can't be blindly handed to `window.location.href`.
 */
export function isSafeConsentRedirectUrl(url: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol)
  } catch {
    return false
  }
}
