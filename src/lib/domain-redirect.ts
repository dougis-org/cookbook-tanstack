/**
 * Returns an absolute redirect URL when the request host differs from the
 * configured primary host, or null when the request should pass through.
 */
export function getDomainRedirectUrl(
  request: Request,
  primaryUrl: string | undefined,
): string | null {
  if (!primaryUrl) return null

  let primaryOrigin: string
  let primaryHostname: string
  try {
    const parsed = new URL(primaryUrl)
    primaryOrigin = parsed.origin
    primaryHostname = parsed.hostname
  } catch {
    return null
  }

  const host = request.headers.get("host")
  if (!host) return null

  let requestHostname: string
  try {
    requestHostname = new URL(`http://${host}`).hostname.toLowerCase()
  } catch {
    return null
  }
  if (requestHostname === primaryHostname.toLowerCase()) return null

  let pathname: string
  let search: string
  try {
    ;({ pathname, search } = new URL(request.url))
  } catch {
    return null
  }
  return `${primaryOrigin}${pathname}${search}`
}
