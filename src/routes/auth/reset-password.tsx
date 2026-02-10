import { createFileRoute } from "@tanstack/react-router"
import { KeyRound } from "lucide-react"
import PageLayout from "@/components/layout/PageLayout"
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
      <PageLayout>
        <div className="max-w-md mx-auto">
          <div className="bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700 text-center">
            <p className="text-red-400">Invalid or missing reset token.</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-md mx-auto">
        <div className="bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <KeyRound className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          </div>
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </PageLayout>
  )
}
