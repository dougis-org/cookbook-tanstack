import { createFileRoute } from "@tanstack/react-router"
import { User } from "lucide-react"
import { authMiddleware } from "@/lib/middleware"
import PageLayout from "@/components/layout/PageLayout"
import ProfileInfo from "@/components/auth/ProfileInfo"

export const Route = createFileRoute("/auth/profile")({
  component: ProfilePage,
  server: {
    middleware: [authMiddleware],
  },
})

function ProfilePage() {
  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Profile</h2>
          </div>
          <ProfileInfo />
        </div>
      </div>
    </PageLayout>
  )
}
