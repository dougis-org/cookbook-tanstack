import { User, Mail, AtSign } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

// No social-login providers or public avatar-hosting CDN are configured for
// this app (see src/lib/auth.ts), so there is currently no legitimate
// external source for `user.image`. Add a host here only once such a source
// is wired up — until then, avatars render only from trusted hosts and fall
// back to the placeholder icon otherwise.
const TRUSTED_AVATAR_HOSTS: readonly string[] = []

function safeImageUrl(image: string | null | undefined): string | null {
  if (!image) return null
  try {
    const url = new URL(image)
    if (url.protocol !== "https:") return null
    return TRUSTED_AVATAR_HOSTS.includes(url.hostname) ? image : null
  } catch {
    return null
  }
}

function memberSinceLabel(createdAt: unknown): string {
  const date = new Date(createdAt as string)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toISOString().split("T")[0]
}

export default function ProfileSection() {
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
  const imageUrl = safeImageUrl(user.image)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
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
          <p className="text-[var(--theme-fg-subtle)] text-sm">Member since {memberSinceLabel(user.createdAt)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 text-[var(--theme-fg-muted)] min-w-0">
          <Mail className="w-5 h-5 text-[var(--theme-accent)] shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
        {("username" in user) && user.username && (
          <div className="flex items-center gap-3 text-[var(--theme-fg-muted)] min-w-0">
            <AtSign className="w-5 h-5 text-[var(--theme-accent)] shrink-0" />
            <span className="truncate">{user.username as string}</span>
          </div>
        )}
      </div>
    </div>
  )
}
