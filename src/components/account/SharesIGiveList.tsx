import { useEffect, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { optimisticListMutation } from "@/lib/optimisticListMutation"
import { toArray, formatDate } from "@/components/account/sharingUtils"

const SCOPE_WARNING =
  "Sharing your library gives this person read access to your entire collection, including private recipes you create in the future."

// Mirrors users.search's input schema (src/server/trpc/routers/users.ts):
// z.object({ query: z.string().trim().min(2).max(254) }).
const USERS_SEARCH_MIN_LENGTH = 2
const USERS_SEARCH_MAX_LENGTH = 254

interface LibraryShareRow {
  id: string
  recipientId: string
  recipientName: string
  addedAt: Date | string
}

const OPTIMISTIC_ID_PREFIX = "optimistic-"

/** A share row is pending while it carries a client-made temp id (no server grant exists yet). */
export function isOptimisticShareId(id: string): boolean {
  return id.startsWith(OPTIMISTIC_ID_PREFIX)
}

function optimisticShareId(recipientId: string): string {
  return `${OPTIMISTIC_ID_PREFIX}${recipientId}`
}

interface InviteContext {
  recipientName: string
  added: boolean
}

interface RevokeContext {
  row: LibraryShareRow
  index: number
}

function failureMessage(prefix: string, error: { message?: string } | null | undefined): string {
  return error?.message ? `${prefix}: ${error.message}` : `${prefix}. Try again.`
}

export default function SharesIGiveList() {
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

  // Names of recipients picked this session, so the optimistic row and the
  // failure message can name them (the mutation input only carries the id).
  const recipientNames = useRef(new Map<string, string>())
  const sharesQueryKey = trpc.sharing.myLibraryShares.queryKey()
  // Invites and revokes edit the same cache entry, so the refetch waits on both.
  const mutationKeys = [trpc.sharing.shareLibrary.mutationKey(), trpc.sharing.revokeLibraryShare.mutationKey()]

  const inviteOptimistic = optimisticListMutation<LibraryShareRow, { recipientId: string }, InviteContext>({
    queryClient,
    queryKey: sharesQueryKey,
    mutationKeys,
    apply: (list, { recipientId }) => {
      const recipientName = recipientNames.current.get(recipientId) ?? ""
      if (list.some((share) => share.recipientId === recipientId)) {
        return { list, context: { recipientName, added: false } }
      }
      const pendingRow: LibraryShareRow = {
        id: optimisticShareId(recipientId),
        recipientId,
        recipientName,
        addedAt: new Date().toISOString(),
      }
      return { list: [...list, pendingRow], context: { recipientName, added: true } }
    },
    revert: (list, { recipientId }, context) =>
      context?.added ? list.filter((share) => share.id !== optimisticShareId(recipientId)) : list,
  })

  const inviteMutation = useMutation(
    trpc.sharing.shareLibrary.mutationOptions({
      ...inviteOptimistic,
      onError: (error, vars, context) => {
        inviteOptimistic.onError(error, vars, context)
        const name = context?.recipientName || recipientNames.current.get(vars.recipientId)
        setInviteError(
          failureMessage(name ? `Unable to share your library with ${name}` : "Unable to share your library", error),
        )
      },
    }),
  )

  const revokeOptimistic = optimisticListMutation<LibraryShareRow, { shareId: string }, RevokeContext>({
    queryClient,
    queryKey: sharesQueryKey,
    mutationKeys,
    apply: (list, { shareId }) => {
      const index = list.findIndex((share) => share.id === shareId)
      if (index < 0) return { list }
      return { list: list.filter((share) => share.id !== shareId), context: { row: list[index], index } }
    },
    revert: (list, _vars, context) => {
      if (!context || list.some((share) => share.id === context.row.id)) return list
      const restored = [...list]
      restored.splice(Math.min(context.index, restored.length), 0, context.row)
      return restored
    },
  })

  const revokeMutation = useMutation(
    trpc.sharing.revokeLibraryShare.mutationOptions({
      ...revokeOptimistic,
      onError: (error, vars, context) => {
        revokeOptimistic.onError(error, vars, context)
        const name = context?.row.recipientName
        setRevokeError(
          failureMessage(name ? `Unable to revoke your share with ${name}` : "Unable to revoke this share", error),
        )
      },
    }),
  )

  function handleSelect(user: { id: string; name: string; email: string }) {
    setInviteError(null)
    recipientNames.current.set(user.id, user.name || user.email)
    inviteMutation.mutate({ recipientId: user.id })
    // Clear synchronously: the pending row carries the state, and the input
    // stays free so further invites can be fired while this one is in flight.
    setSearchInput("")
    setDebouncedSearch("")
  }

  function handleRevoke(shareId: string) {
    setRevokeError(null)
    revokeMutation.mutate({ shareId })
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
          className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
        />
        {debouncedSearch.length >= USERS_SEARCH_MIN_LENGTH && searchResults.length > 0 && (
          <ul className="mt-1 border border-[var(--theme-border)] rounded-lg overflow-hidden">
            {searchResults.map((u: { id: string; name: string; email: string }) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(u)}
                  className="w-full text-left px-3 py-2 text-sm bg-[var(--theme-surface-raised)] hover:bg-[var(--theme-surface-hover)] transition-colors"
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
          {shares.map((share: LibraryShareRow) => {
            const isPending = isOptimisticShareId(share.id)
            return (
              <li
                key={share.id}
                aria-busy={isPending || undefined}
                className={`flex items-center justify-between gap-4 rounded-lg border border-[var(--theme-border)] px-4 py-3 transition-colors ${isPending ? "opacity-60" : ""}`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--theme-fg)] truncate">{share.recipientName}</p>
                  <p className="text-xs text-[var(--theme-fg-subtle)]">
                    {isPending ? "Sharing…" : `Shared ${formatDate(share.addedAt)}`}
                  </p>
                </div>
                {!isPending && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(share.id)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--theme-fg-muted)] hover:bg-[var(--theme-surface-hover)] transition-colors"
                  >
                    <X size={14} aria-hidden="true" />
                    Revoke
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
