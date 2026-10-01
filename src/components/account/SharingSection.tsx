import { useEffect, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Share2, Users, BookOpen, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { trpc } from "@/lib/trpc"
import type { EntitlementTier } from "@/lib/tier-entitlements"

const SCOPE_WARNING =
  "Sharing your library gives this person read access to your entire collection, including private recipes you create in the future."

/** Defensive against a malformed (non-array) query response — never renders a crash. */
function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toISOString().split("T")[0]
}

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

interface LibraryShareRow {
  id: string
  recipientId: string
  recipientName: string
  addedAt: Date | string
}

function SharesIGiveList() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: sharesData, isLoading } = useQuery(trpc.sharing.myLibraryShares.queryOptions())
  const shares = toArray<LibraryShareRow>(sharesData)

  const { data: searchResultsData } = useQuery({
    ...trpc.users.search.queryOptions({ query: debouncedSearch }),
    enabled: debouncedSearch.length >= 2,
  })
  const searchResults = toArray<{ id: string; name: string; email: string }>(searchResultsData)

  function invalidateShares() {
    queryClient.invalidateQueries({ queryKey: trpc.sharing.myLibraryShares.queryKey() })
  }

  const inviteMutation = useMutation(
    trpc.sharing.shareLibrary.mutationOptions({
      onSuccess: () => {
        invalidateShares()
        setSearchInput("")
        setDebouncedSearch("")
        setInviteError(null)
      },
      onError: (error: { message?: string }) => {
        setInviteError(error?.message || "Unable to share your library. Try again.")
      },
    }),
  )

  const revokeMutation = useMutation(
    trpc.sharing.revokeLibraryShare.mutationOptions({
      onSuccess: () => {
        invalidateShares()
        setRevokeError(null)
      },
      onError: (error: { message?: string }) => {
        setRevokeError(error?.message || "Unable to revoke this share. Try again.")
      },
    }),
  )

  function handleSelect(user: { id: string; name: string; email: string }) {
    setInviteError(null)
    inviteMutation.mutate({ recipientId: user.id })
    setSearchInput(user.name || user.email)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[var(--theme-fg)]">Libraries You Share</h3>
      <p className="text-sm text-[var(--theme-fg-muted)]">{SCOPE_WARNING}</p>

      <div className="relative">
        <label htmlFor="sharing-invite-input" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-1">
          Search by email or name
        </label>
        <input
          id="sharing-invite-input"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Type to search…"
          disabled={inviteMutation.isPending}
          className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent disabled:opacity-50"
        />
        {debouncedSearch.length >= 2 && searchResults.length > 0 && (
          <ul className="mt-1 border border-[var(--theme-border)] rounded-lg overflow-hidden">
            {searchResults.map((u: { id: string; name: string; email: string }) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(u)}
                  disabled={inviteMutation.isPending}
                  className="w-full text-left px-3 py-2 text-sm bg-[var(--theme-surface-raised)] hover:bg-[var(--theme-surface-hover)] transition-colors disabled:opacity-50"
                >
                  <span className="font-medium text-[var(--theme-fg)]">{u.name}</span>
                  <span className="ml-2 text-[var(--theme-fg-muted)]">{u.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {debouncedSearch.length >= 2 && searchResults.length === 0 && (
          <p className="mt-1 text-sm text-[var(--theme-fg-muted)]">No users found.</p>
        )}
        {inviteMutation.isPending && (
          <p className="mt-1 text-sm text-[var(--theme-fg-muted)]">Sharing…</p>
        )}
        {inviteError && (
          <p role="alert" className="mt-1 text-sm text-[var(--theme-error)]">
            {inviteError}
          </p>
        )}
      </div>

      {revokeError && (
        <p role="alert" className="text-sm text-[var(--theme-error)]">
          {revokeError}
        </p>
      )}

      {isLoading ? (
        <div data-testid="shares-i-give-loading" className="animate-pulse h-10 w-full rounded bg-[var(--theme-border)]" />
      ) : shares.length === 0 ? (
        <p data-testid="shares-i-give-empty" className="text-sm text-[var(--theme-fg-muted)]">
          You haven't shared your library with anyone yet.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Libraries you share">
          {shares.map((share: LibraryShareRow) => (
            <li
              key={share.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-[var(--theme-border)] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--theme-fg)] truncate">{share.recipientName}</p>
                <p className="text-xs text-[var(--theme-fg-subtle)]">Shared {formatDate(share.addedAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => revokeMutation.mutate({ shareId: share.id })}
                disabled={revokeMutation.isPending}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--theme-fg-muted)] hover:bg-[var(--theme-surface-hover)] transition-colors disabled:opacity-50"
              >
                <X size={14} aria-hidden="true" />
                {revokeMutation.isPending ? "Revoking…" : "Revoke"}
              </button>
            </li>
          ))}
        </ul>
      )}
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
  const rawTier = session?.user?.tier as EntitlementTier | undefined
  const isExecChef = rawTier === "executive-chef"

  const { data: sharedWithMeData } = useQuery(trpc.sharing.mySharedLibraries.queryOptions())
  const sharedWithMe = toArray<SharedLibraryRow>(sharedWithMeData)
  const { data: collaborationsData } = useQuery(trpc.cookbooks.myCollaborations.queryOptions())
  const collaborations = toArray<CollaborationRow>(collaborationsData)

  const hasReceived = sharedWithMe.length > 0 || collaborations.length > 0
  const showSection = isExecChef || hasReceived

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
