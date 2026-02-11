import { createFileRoute } from "@tanstack/react-router"
import { KeyRound } from "lucide-react"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import ResetPasswordForm from "@/components/auth/ResetPasswordForm"

interface ResetPasswordSearch {
  token?: string
}

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()

  if (!token) {
    return (
      <AuthPageLayout icon={KeyRound} title="Reset Password">
        <p className="text-red-400 text-center">Invalid or missing reset token.</p>
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout icon={KeyRound} title="Reset Password">
      <ResetPasswordForm token={token} />
    </AuthPageLayout>
  )
}
