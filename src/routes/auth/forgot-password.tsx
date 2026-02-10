import { createFileRoute } from "@tanstack/react-router"
import { KeyRound } from "lucide-react"
import PageLayout from "@/components/layout/PageLayout"
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm"

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <PageLayout>
      <div className="max-w-md mx-auto">
        <div className="bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <KeyRound className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Forgot Password</h2>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </PageLayout>
  )
}
