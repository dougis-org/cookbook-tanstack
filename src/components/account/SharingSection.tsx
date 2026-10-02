import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Share2, Users, BookOpen } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { trpc } from "@/lib/trpc"
import SharesIGiveList from "@/components/account/SharesIGiveList"
import { toArray, formatDate } from "@/components/account/sharingUtils"

import { hasAtLeastTier } from "@/types/user"

function UpgradeAffordance() {
  return (
    <div className="up-card flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm text-[var(--theme-fg-muted)]">
      <Share2 size={16} className="shrink-0 text-[var(--theme-fg-subtle)]" aria-hidden="true" />
      <span className="up-body">
        Sharing your library with other cooks is part of Executive Chef. Upgrade to invite people to your collection.
      </span>
      <Link
        to="/pricing"
        className="up-cta ml-auto shrink-0 font-medium text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors"
      >
        Upgrade
      </Link>
    </div>
  )
}

interface SharedLibraryRow {
  id: string
  ownerId: string
  ownerName: string
  addedAt: Date | string
}

function SharedWithMeList() {
  const { data: sharesData, isLoading } = useQuery(trpc.sharing.mySharedLibraries.queryOptions())
  const shares = toArray<SharedLibraryRow>(sharesData)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[var(--theme-fg)]">Libraries Shared With You</h3>
      {isLoading ? (
        <div data-testid="shared-with-me-loading" className="animate-pulse h-10 w-full rounded bg-[var(--theme-border)]" />
      ) : shares.length === 0 ? (
        <p data-testid="shared-with-me-empty" className="text-sm text-[var(--theme-fg-muted)]">
          No one has shared their library with you yet.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Libraries shared with you">
          {shares.map((share: SharedLibraryRow) => (
            <li
              key={share.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--theme-border)] px-4 py-3"
            >
              <Users size={16} className="shrink-0 text-[var(--theme-accent)]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-[var(--theme-fg)] truncate">{share.ownerName}</p>
                <p className="text-xs text-[var(--theme-fg-subtle)]">Shared {formatDate(share.addedAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface CollaborationRow {
  id: string
  name: string
  role: "editor" | "viewer"
}

function MyCollaborationsList() {
  const { data: collaborationsData, isLoading } = useQuery(trpc.cookbooks.myCollaborations.queryOptions())
  const collaborations = toArray<CollaborationRow>(collaborationsData)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[var(--theme-fg)]">Your Cookbook Collaborations</h3>
      {isLoading ? (
        <div data-testid="my-collaborations-loading" className="animate-pulse h-10 w-full rounded bg-[var(--theme-border)]" />
      ) : collaborations.length === 0 ? (
        <p data-testid="my-collaborations-empty" className="text-sm text-[var(--theme-fg-muted)]">
          You're not collaborating on any cookbooks yet.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Your cookbook collaborations">
          {collaborations.map((cookbook: CollaborationRow) => (
            <li
              key={cookbook.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--theme-border)] px-4 py-3"
            >
              <BookOpen size={16} className="shrink-0 text-[var(--theme-accent)]" aria-hidden="true" />
              <Link
                to="/cookbooks/$cookbookId"
                params={{ cookbookId: cookbook.id }}
                className="font-medium text-[var(--theme-fg)] truncate hover:text-[var(--theme-accent)] transition-colors"
              >
                {cookbook.name}
              </Link>
              <span className="ml-auto shrink-0 text-xs capitalize text-[var(--theme-fg-subtle)]">{cookbook.role}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function SharingSection() {
  const { session } = useAuth()
  const isExecChef = hasAtLeastTier(
    { tier: session?.user?.tier, isAdmin: session?.user?.isAdmin },
    "executive-chef",
  )

  const {
    data: sharedWithMeData,
    isLoading: isSharedWithMeLoading,
    isError: isSharedWithMeError,
  } = useQuery(trpc.sharing.mySharedLibraries.queryOptions())
  const sharedWithMe = toArray<SharedLibraryRow>(sharedWithMeData)
  const {
    data: collaborationsData,
    isLoading: isCollaborationsLoading,
    isError: isCollaborationsError,
  } = useQuery(trpc.cookbooks.myCollaborations.queryOptions())
  const collaborations = toArray<CollaborationRow>(collaborationsData)

  const hasReceived = sharedWithMe.length > 0 || collaborations.length > 0
  // Only collapse to the upgrade affordance once it's certain: a
  // non-Executive-Chef user, both gating queries have settled without
  // error, and both are confirmed empty. A still-loading or errored query
  // fails open to the full section (whose own list components show their
  // own loading/empty state) rather than flashing, or wrongly committing
  // to, the upsell.
  const gatingSettled = !isSharedWithMeLoading && !isCollaborationsLoading
  const gatingErrored = isSharedWithMeError || isCollaborationsError
  const showSection = isExecChef || hasReceived || !gatingSettled || gatingErrored

  if (!session) return null

  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 space-y-6">
      <h2 className="text-xl font-bold text-[var(--theme-fg)]">Sharing &amp; Collaboration</h2>
      {!showSection ? (
        <UpgradeAffordance />
      ) : (
        <>
          {isExecChef && <SharesIGiveList />}
          <SharedWithMeList />
          <MyCollaborationsList />
        </>
      )}
    </div>
  )
}
