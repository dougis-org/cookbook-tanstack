import { createFileRoute } from "@tanstack/react-router"
import { LogIn } from "lucide-react"
import PageLayout from "@/components/layout/PageLayout"
import LoginForm from "@/components/auth/LoginForm"

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
})

function LoginPage() {
  return (
    <PageLayout>
      <div className="max-w-md mx-auto">
        <div className="bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <LogIn className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Sign In</h2>
          </div>
          <LoginForm />
        </div>
      </div>
    </PageLayout>
  )
}
