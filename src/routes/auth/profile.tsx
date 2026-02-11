import { createFileRoute } from "@tanstack/react-router"
import { User } from "lucide-react"
import { authMiddleware } from "@/lib/middleware"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import ProfileInfo from "@/components/auth/ProfileInfo"

export const Route = createFileRoute("/auth/profile")({
  component: ProfilePage,
  server: {
    middleware: [authMiddleware],
  },
})

function ProfilePage() {
  return (
    <AuthPageLayout icon={User} title="Profile">
      <ProfileInfo />
    </AuthPageLayout>
  )
}
