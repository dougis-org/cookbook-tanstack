import { createFileRoute } from "@tanstack/react-router"
import { MailCheck } from "lucide-react"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import VerifyEmailPage from "@/components/auth/VerifyEmailPage"

export const Route = createFileRoute("/auth/verify-email")({
  component: VerifyEmailRoute,
  validateSearch: (search: Record<string, unknown>): { error?: string } => ({
    error: typeof search.error === "string" && search.error.length > 0 ? search.error : undefined,
  }),
})

function VerifyEmailRoute() {
  const { error } = Route.useSearch()

  return (
    <AuthPageLayout icon={MailCheck} title="Email Verification">
      <VerifyEmailPage error={error} />
    </AuthPageLayout>
  )
}
