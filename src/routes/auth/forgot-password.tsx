import { createFileRoute } from "@tanstack/react-router"
import { KeyRound } from "lucide-react"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm"

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <AuthPageLayout icon={KeyRound} title="Forgot Password">
      <ForgotPasswordForm />
    </AuthPageLayout>
  )
}
