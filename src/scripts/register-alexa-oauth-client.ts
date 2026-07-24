/**
 * One-time manual step (task 2.6): register the Alexa skill as an OAuth
 * client of this app's `@better-auth/oauth-provider` instance.
 *
 * `auth.api.createOAuthClient` requires an authenticated session, so this
 * cannot run as an unattended seed script — it must be invoked by a signed-in
 * admin against a running deployment. Usage:
 *
 *   ADMIN_SESSION_TOKEN=<cookie value from an admin's browser session> \
 *   APP_BASE_URL=https://cookbook.example.com \
 *   ALEXA_REDIRECT_URIS=https://layla.amazon.com/api/skill/link/XXXXX \
 *   npx tsx src/scripts/register-alexa-oauth-client.ts
 *
 * Prints the issued client_id/client_secret — store them as
 * ALEXA_OAUTH_CLIENT_ID / ALEXA_OAUTH_CLIENT_SECRET for the skill manifest.
 * The exact redirect URI comes from the Amazon Developer Console during the
 * discovery spike (task 1.1) and cannot be known ahead of that manual step.
 */

export function buildCreateClientRequest(
  baseUrl: string,
  sessionToken: string,
  redirectUris: string[],
): { url: string; init: RequestInit } {
  return {
    url: `${baseUrl}/api/auth/oauth2/create-client`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `better-auth.session_token=${sessionToken}`,
      },
      body: JSON.stringify({
        redirect_uris: redirectUris,
        client_name: "My CookBooks Alexa Skill",
        scope: "read:own-content",
      }),
    },
  };
}

async function main() {
  const baseUrl = process.env.APP_BASE_URL;
  const sessionToken = process.env.ADMIN_SESSION_TOKEN;
  const redirectUris = process.env.ALEXA_REDIRECT_URIS?.split(",").map((s) => s.trim()).filter(Boolean);

  if (!baseUrl || !sessionToken || !redirectUris?.length) {
    console.error(
      "Usage: APP_BASE_URL=... ADMIN_SESSION_TOKEN=... ALEXA_REDIRECT_URIS=... npx tsx src/scripts/register-alexa-oauth-client.ts",
    );
    process.exit(1);
  }

  const { url, init } = buildCreateClientRequest(baseUrl, sessionToken, redirectUris);
  const response = await fetch(url, init);
  const body = await response.json();
  if (!response.ok) {
    console.error("Failed to register OAuth client:", body);
    process.exit(1);
  }
  console.log("Registered Alexa OAuth client:", body);
}

if (!process.env.VITEST) {
  main();
}
