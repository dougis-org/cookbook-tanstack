import { createFileRoute, redirect } from "@tanstack/react-router"
import { requireAuth } from "@/lib/auth-guard"

export const Route = createFileRoute("/account_/settings")({
  beforeLoad: (args) => {
    requireAuth()(args)
    throw redirect({ to: "/account" })
  },
  component: LegacyAccountSettingsRedirect,
})

// Unreachable: beforeLoad always throws a redirect before this would render.
function LegacyAccountSettingsRedirect() {
  return null
}
