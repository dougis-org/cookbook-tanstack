import { createFileRoute } from "@tanstack/react-router"
import { UserPlus } from "lucide-react"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import RegisterForm from "@/components/auth/RegisterForm"

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <AuthPageLayout icon={UserPlus} title="Create Account">
      <RegisterForm />
    </AuthPageLayout>
  )
}
