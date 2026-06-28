import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import { TIER_DISPLAY_NAMES } from '@/lib/tier-entitlements'

const dateParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined)

const auditSearchSchema = z.object({
  userId: z.string().optional(),
  from: dateParam,
  to: dateParam,
  page: z.coerce.number().int().min(1).default(1).catch(1),
})

const LIMIT = 25

export const AdminAuditPage = () => {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/admin/audit' })
  const page = search.page ?? 1

  const { data } = useQuery(
    trpc.admin.auditLog.list.queryOptions({
      userId: search.userId,
      from: search.from ? new Date(search.from + 'T00:00:00.000Z').toISOString() : undefined,
      to: search.to ? new Date(search.to + 'T23:59:59.999Z').toISOString() : undefined,
      page,
    }),
  )

  const entries = data?.entries ?? []
  const total = data?.total ?? 0

  function updateSearch(update: Record<string, string | number | undefined>) {
    navigate({ replace: true, search: (prev) => ({ ...prev, page: 1, ...update }) })
  }

  const hasPrev = page > 1
  const hasNext = page * LIMIT < total

  return (
    <div>
      <h2 className="text-xl font-semibold text-[var(--theme-fg)] mb-6">Audit Log</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--theme-fg-muted)]" htmlFor="audit-userId">
            Target User ID
          </label>
          <input
            id="audit-userId"
            type="text"
            placeholder="Filter by user ID…"
            defaultValue={search.userId ?? ''}
            onBlur={(e) => updateSearch({ userId: e.target.value || undefined })}
            className="text-sm rounded border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-fg)] px-3 py-1.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--theme-fg-muted)]" htmlFor="audit-from">
            From
          </label>
          <input
            id="audit-from"
            type="date"
            defaultValue={search.from ?? ''}
            onChange={(e) => updateSearch({ from: e.target.value || undefined })}
            className="text-sm rounded border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-fg)] px-3 py-1.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--theme-fg-muted)]" htmlFor="audit-to">
            To
          </label>
          <input
            id="audit-to"
            type="date"
            defaultValue={search.to ?? ''}
            onChange={(e) => updateSearch({ to: e.target.value || undefined })}
            className="text-sm rounded border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-fg)] px-3 py-1.5"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--theme-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--theme-surface-raised)]">
            <tr>
              <th className="text-left px-4 py-3 text-[var(--theme-fg-muted)] font-medium">Timestamp</th>
              <th className="text-left px-4 py-3 text-[var(--theme-fg-muted)] font-medium">Admin</th>
              <th className="text-left px-4 py-3 text-[var(--theme-fg-muted)] font-medium">Target User</th>
              <th className="text-left px-4 py-3 text-[var(--theme-fg-muted)] font-medium">Before</th>
              <th className="text-left px-4 py-3 text-[var(--theme-fg-muted)] font-medium">After</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[var(--theme-fg-muted)]"
                >
                  No audit log entries found
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-t border-[var(--theme-border)] hover:bg-[var(--theme-surface-hover)]"
                >
                  <td className="px-4 py-3 text-[var(--theme-fg-muted)] whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[var(--theme-fg)]">{entry.adminEmail}</td>
                  <td className="px-4 py-3 text-[var(--theme-fg)]">{entry.targetEmail}</td>
                  <td className="px-4 py-3 text-[var(--theme-fg-muted)]">
                    {TIER_DISPLAY_NAMES[entry.before.tier as keyof typeof TIER_DISPLAY_NAMES] ?? entry.before.tier}
                  </td>
                  <td className="px-4 py-3 text-[var(--theme-fg-muted)]">
                    {TIER_DISPLAY_NAMES[entry.after.tier as keyof typeof TIER_DISPLAY_NAMES] ?? entry.after.tier}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-[var(--theme-fg-muted)]">
          {total === 0 ? 'No entries' : `${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total}`}
        </p>
        <div className="flex gap-2">
          <button
            disabled={!hasPrev}
            onClick={() => navigate({ replace: true, search: (prev) => ({ ...prev, page: page - 1 }) })}
            className="px-3 py-1 text-sm rounded border border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-[var(--theme-fg-muted)]">Page {page}</span>
          <button
            disabled={!hasNext}
            onClick={() => navigate({ replace: true, search: (prev) => ({ ...prev, page: page + 1 }) })}
            className="px-3 py-1 text-sm rounded border border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/admin/audit')({
  validateSearch: auditSearchSchema,
  component: AdminAuditPage,
})
