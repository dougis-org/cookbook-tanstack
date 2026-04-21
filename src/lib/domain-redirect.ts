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
  // IP-addressed Host headers come from health checks / internal traffic — pass through
  if (/^((25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/.test(requestHostname)) return null
  if (requestHostname.startsWith("[")) return null // IPv6: WHATWG URL keeps brackets in .hostname

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
