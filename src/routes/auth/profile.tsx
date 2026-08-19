import { createFileRoute, redirect } from "@tanstack/react-router"
import { requireAuth } from "@/lib/auth-guard"

export const Route = createFileRoute("/auth/profile")({
  beforeLoad: (args) => {
    requireAuth()(args)
    throw redirect({ to: "/account" })
  },
  component: LegacyProfileRedirect,
})

// Unreachable: beforeLoad always throws a redirect before this would render.
function LegacyProfileRedirect() {
  return null
}
