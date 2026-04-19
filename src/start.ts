import { createStart, createMiddleware } from "@tanstack/react-start"
import { getDomainRedirectUrl } from "@/lib/domain-redirect"

const domainRedirectMiddleware = createMiddleware({ type: "request" }).server(
  ({ next, request }) => {
    const redirectUrl = getDomainRedirectUrl(
      request,
      process.env.APP_PRIMARY_URL,
    )
    if (redirectUrl) {
      return new Response(null, {
        status: 301,
        headers: { Location: redirectUrl },
      })
    }
    return next()
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [domainRedirectMiddleware],
}))
