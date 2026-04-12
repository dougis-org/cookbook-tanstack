import { createFileRoute } from "@tanstack/react-router"
import { LogIn } from "lucide-react"
import type { RedirectReason } from "@/lib/auth-guard"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import LoginForm from "@/components/auth/LoginForm"

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { reason?: RedirectReason; from?: string } => ({
    reason:
      search.reason === "auth-required" || search.reason === "tier-limit-reached"
        ? search.reason
        : undefined,
    from: typeof search.from === "string" ? search.from : undefined,
  }),
})

function LoginPage() {
  const { reason, from } = Route.useSearch()
  return (
    <AuthPageLayout icon={LogIn} title="Sign In">
      <LoginForm reason={reason} from={from} />
    </AuthPageLayout>
  )
}
