import { createFileRoute } from "@tanstack/react-router"
import { UserPlus } from "lucide-react"
import PageLayout from "@/components/layout/PageLayout"
import RegisterForm from "@/components/auth/RegisterForm"

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <PageLayout>
      <div className="max-w-md mx-auto">
        <div className="bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
          </div>
          <RegisterForm />
        </div>
      </div>
    </PageLayout>
  )
}
