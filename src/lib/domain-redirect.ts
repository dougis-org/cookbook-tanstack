/**
 * Returns an absolute redirect URL when the request host differs from the
 * configured primary host, or null when the request should pass through.
 */
export function getDomainRedirectUrl(
  request: Request,
  primaryUrl: string | undefined,
): string | null {
  if (!primaryUrl) return null

  let primaryHostname: string
  try {
    primaryHostname = new URL(primaryUrl).hostname
  } catch {
    return null
  }

  const host = request.headers.get("host")
  if (!host) return null

  const requestHostname = host.split(":")[0]
  if (requestHostname === primaryHostname) return null

  const { pathname, search } = new URL(request.url)
  return `${primaryUrl.replace(/\/$/, "")}${pathname}${search}`
}
