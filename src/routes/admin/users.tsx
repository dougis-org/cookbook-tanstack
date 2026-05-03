import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/hooks/useAuth'
import { TIER_RANK, type UserTier } from '@/types/user'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
})

const TIER_LABELS: Record<UserTier, string> = {
  'home-cook': 'Home Cook',
  'prep-cook': 'Prep Cook',
  'sous-chef': 'Sous Chef',
  'executive-chef': 'Executive Chef',
}

const TIER_VALUES: UserTier[] = ['home-cook', 'prep-cook', 'sous-chef', 'executive-chef']

interface PendingChange {
  userId: string
  userEmail: string
  fromTier: UserTier
  toTier: UserTier
}

type UserRow = {
  id: string
  email: string
  name: string | null
  tier?: UserTier
}

export function AdminUsersPage() {
  const { session } = useAuth()
  const currentUserId = session?.user.id
  const [pending, setPending] = useState<PendingChange | null>(null)
  const queryClient = useQueryClient()

  const { data: users = [] } = useQuery(trpc.admin.users.list.queryOptions())

  const setTierMutation = useMutation(
    trpc.admin.users.setTier.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.admin.users.list.queryKey() })
        setPending(null)
      },
    }),
  )

  function handleTierChange(userId: string, userEmail: string, currentTier: UserTier, newTier: UserTier) {
    if (newTier === currentTier) return
    setPending({ userId, userEmail, fromTier: currentTier, toTier: newTier })
  }

  function handleConfirm() {
    if (!pending) return
    setTierMutation.mutate({ userId: pending.userId, tier: pending.toTier })
  }

  function handleCancel() {
    if (setTierMutation.isPending) return
    setPending(null)
  }

  useEffect(() => {
    if (!pending) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [pending, setTierMutation.isPending])

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--theme-fg)] mb-6">Users</h2>

      <div className="overflow-x-auto rounded-lg border border-[var(--theme-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--theme-surface-raised)]">
            <tr>
              <th className="text-left px-4 py-3 text-[var(--theme-fg-muted)] font-medium">Email</th>
              <th className="text-left px-4 py-3 text-[var(--theme-fg-muted)] font-medium">Name</th>
              <th className="text-left px-4 py-3 text-[var(--theme-fg-muted)] font-medium">Tier</th>
              <th className="text-left px-4 py-3 text-[var(--theme-fg-muted)] font-medium">Change Tier</th>
              <th className="text-left px-4 py-3 text-[var(--theme-fg-muted)] font-medium">Audit</th>
            </tr>
          </thead>
          <tbody>
            {(users as UserRow[]).map((user) => {
              const isSelf = user.id === currentUserId
              const currentTier = (user.tier ?? 'home-cook') as UserTier
              return (
                <tr key={user.id} className="border-t border-[var(--theme-border)] hover:bg-[var(--theme-surface-hover)]">
                  <td className="px-4 py-3 text-[var(--theme-fg)]">{user.email}</td>
                  <td className="px-4 py-3 text-[var(--theme-fg-muted)]">{user.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--theme-surface-raised)] text-[var(--theme-fg-muted)]">
                      {TIER_LABELS[currentTier] ?? currentTier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      disabled={isSelf}
                      value={pending?.userId === user.id ? pending.toTier : currentTier}
                      onChange={(e) =>
                        handleTierChange(user.id, user.email, currentTier, e.target.value as UserTier)
                      }
                      aria-label={`Change tier for ${user.email}`}
                      className="text-sm rounded border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-fg)] px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {TIER_VALUES.map((tier) => (
                        <option key={tier} value={tier}>
                          {TIER_LABELS[tier]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/audit?userId=${user.id}`}
                      aria-disabled="true"
                      tabIndex={-1}
                      onClick={(e) => e.preventDefault()}
                      data-user-id={user.id}
                      className="text-xs text-[var(--theme-fg-subtle)] opacity-50 cursor-not-allowed"
                      title="Audit log viewer coming soon"
                    >
                      View audit log
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-warning"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancel()
          }}
        >
          <div className="bg-[var(--theme-bg)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-[var(--theme-border)]">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-[var(--theme-fg)] mb-2">
              Confirm Tier Change
            </h3>
            <p id="confirm-dialog-desc" className="text-sm text-[var(--theme-fg-muted)] mb-6">
              Change <strong>{pending.userEmail}</strong> from{' '}
              <strong>{TIER_LABELS[pending.fromTier]}</strong> to{' '}
              <strong>{TIER_LABELS[pending.toTier]}</strong>?
            </p>
            {TIER_RANK[pending.fromTier] > TIER_RANK[pending.toTier] && (
              <div id="confirm-dialog-warning" className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ This will make all private recipes and cookbooks public, and hide any
                  content over the new tier's limit. Your oldest content is preserved first.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 text-sm font-medium rounded-lg border border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={setTierMutation.isPending}
                className="flex-1 py-2 text-sm font-medium rounded-lg bg-[var(--theme-accent)] text-white hover:bg-[var(--theme-accent-hover)] transition-colors disabled:opacity-60"
              >
                {setTierMutation.isPending ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
