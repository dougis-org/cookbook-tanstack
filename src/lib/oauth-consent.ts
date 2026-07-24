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
