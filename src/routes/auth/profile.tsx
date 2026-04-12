import { createFileRoute } from "@tanstack/react-router"
import { User } from "lucide-react"
import { requireAuth } from "@/lib/auth-guard"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import ProfileInfo from "@/components/auth/ProfileInfo"

export const Route = createFileRoute("/auth/profile")({
  component: ProfilePage,
  beforeLoad: requireAuth(),
})

function ProfilePage() {
  return (
    <AuthPageLayout icon={User} title="Profile">
      <ProfileInfo />
    </AuthPageLayout>
  )
}
