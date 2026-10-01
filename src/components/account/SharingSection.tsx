import { useEffect, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Share2, Users, BookOpen, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { trpc } from "@/lib/trpc"
import { hasAtLeastTier } from "@/types/user"

const SCOPE_WARNING =
  "Sharing your library gives this person read access to your entire collection, including private recipes you create in the future."

// Mirrors users.search's input schema (src/server/trpc/routers/users.ts):
// z.object({ query: z.string().trim().min(2).max(254) }).
const USERS_SEARCH_MIN_LENGTH = 2
const USERS_SEARCH_MAX_LENGTH = 254

/**
 * Defensive against a malformed query response: never renders a crash on a
 * non-array value, and drops any row that isn't a plain object with a
 * string `id` (every row shape this component consumes has one) rather than
 * trusting the array's contents wholesale. Logs when it has to drop
 * anything, so a real API-contract break doesn't look indistinguishable
 * from "genuinely has nothing to show" in a bug report.
 */
function toArray<T extends { id: string }>(value: unknown): T[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    console.error("SharingSection: expected an array from a sharing/collaboration query, got", value)
    return []
  }
  const rows = value.filter(
    (row): row is T => typeof row === "object" && row !== null && typeof (row as { id?: unknown }).id === "string",
  )
  if (rows.length !== value.length) {
    console.error(
      `SharingSection: dropped ${value.length - rows.length} malformed row(s) from a sharing/collaboration query response`,
    )
  }
  return rows
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
    // Mirror the server's users.search input schema (trim, 254-char max) so the
    // client never issues a request the server would reject, and so "enabled"
    // reflects the same length check the server applies.
    const timer = setTimeout(
      () => setDebouncedSearch(searchInput.trim().slice(0, USERS_SEARCH_MAX_LENGTH)),
      400,
    )
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: sharesData, isLoading } = useQuery(trpc.sharing.myLibraryShares.queryOptions())
  const shares = toArray<LibraryShareRow>(sharesData)

  const { data: searchResultsData, isLoading: isSearchLoading } = useQuery({
    ...trpc.users.search.queryOptions({ query: debouncedSearch }),
    enabled: debouncedSearch.length >= USERS_SEARCH_MIN_LENGTH,
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
        {debouncedSearch.length >= USERS_SEARCH_MIN_LENGTH && searchResults.length > 0 && (
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
        {debouncedSearch.length >= USERS_SEARCH_MIN_LENGTH && !isSearchLoading && searchResults.length === 0 && (
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
                disabled={revokeMutation.isPending && revokeMutation.variables?.shareId === share.id}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--theme-fg-muted)] hover:bg-[var(--theme-surface-hover)] transition-colors disabled:opacity-50"
              >
                <X size={14} aria-hidden="true" />
                {revokeMutation.isPending && revokeMutation.variables?.shareId === share.id ? "Revoking…" : "Revoke"}
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
