import { createFileRoute } from "@tanstack/react-router"
import { LogIn } from "lucide-react"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import LoginForm from "@/components/auth/LoginForm"

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
})

function LoginPage() {
  return (
    <AuthPageLayout icon={LogIn} title="Sign In">
      <LoginForm />
    </AuthPageLayout>
  )
}
