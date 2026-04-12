import { User, Mail, AtSign } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function ProfileInfo() {
  const { session, isPending } = useAuth()

  if (isPending) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 w-20 rounded-full bg-[var(--theme-surface-raised)]" />
        <div className="h-4 w-48 bg-[var(--theme-surface-raised)] rounded" />
        <div className="h-4 w-64 bg-[var(--theme-surface-raised)] rounded" />
      </div>
    )
  }

  if (!session) return null

  const { user } = session

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User avatar"}
            className="w-20 h-20 rounded-full object-cover border-2 border-[var(--theme-accent)]"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[var(--theme-surface-raised)] flex items-center justify-center border-2 border-[var(--theme-accent)]">
            <User className="w-10 h-10 text-[var(--theme-fg-subtle)]" />
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold text-[var(--theme-fg)]">{user.name || "No name set"}</h3>
          <p className="text-[var(--theme-fg-subtle)] text-sm">Member since {new Date(user.createdAt).toISOString().split("T")[0]}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 text-[var(--theme-fg-muted)]">
          <Mail className="w-5 h-5 text-[var(--theme-accent)]" />
          <span>{user.email}</span>
        </div>
        {("username" in user) && user.username && (
          <div className="flex items-center gap-3 text-[var(--theme-fg-muted)]">
            <AtSign className="w-5 h-5 text-[var(--theme-accent)]" />
            <span>{user.username as string}</span>
          </div>
        )}
      </div>
    </div>
  )
}
