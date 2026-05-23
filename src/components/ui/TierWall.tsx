import { useEffect, useRef, useId } from 'react'
import { Link } from '@tanstack/react-router'
import type { TierWallReason } from '@/lib/trpc-error'
import { useTierEntitlements } from '@/hooks/useTierEntitlements'
import { TIER_LIMITS, TIER_PRICING, TIER_DISPLAY_NAMES } from '@/lib/tier-entitlements'
import { getNextTier } from '@/lib/nudgeCopy'

interface TierWallProps {
  reason: TierWallReason
  display: 'inline' | 'modal'
  onDismiss?: () => void
}

const MESSAGES: Record<TierWallReason, { title: string; body: string }> = {
  'count-limit': { title: 'Plan limit reached', body: "You've reached the recipe or cookbook limit for your current plan." },
  'private-content': { title: 'Private content requires Sous Chef', body: 'Private recipes and cookbooks require Sous Chef tier or above.' },
  'import': { title: 'Import requires Executive Chef', body: 'Recipe import requires Executive Chef tier.' },
}

export default function TierWall({ reason, display, onDismiss }: TierWallProps) {
  const { title, body } = MESSAGES[reason]
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const titleId = `tw-title-${id}`
  const descId = `tw-desc-${id}`

  const { tier } = useTierEntitlements()
  const nextTier = getNextTier(tier)
  const showComparison = reason === 'count-limit' && display === 'modal' && nextTier !== null

  useEffect(() => {
    if (display !== 'modal') return

    const prev = document.activeElement
    ref.current?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss?.()
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      if (prev instanceof HTMLElement && typeof prev.focus === 'function') {
        prev.focus()
      }
    }
  }, [display, onDismiss])

  if (display === 'inline') {
    return (
      <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-md px-3 py-2 border border-amber-200 dark:border-amber-800/50">
        <span className="font-medium">{title}.</span>{' '}{body}{' '}
        <Link to="/pricing" className="underline font-medium text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)]">Upgrade</Link> to unlock more.
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onDismiss?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl p-6 max-w-md w-full shadow-2xl outline-none"
      >
        <h2 id={titleId} className="text-lg font-bold text-[var(--theme-fg)] mb-2">
          {title}
        </h2>
        <p id={descId} className="text-[var(--theme-fg-muted)] mb-6">
          {body}
        </p>
        {showComparison && nextTier && (
          <div className="border border-[var(--theme-border)] rounded-lg overflow-hidden mb-6 bg-[var(--theme-surface-hover)]">
            <table className="w-full text-xs border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--theme-border)] bg-[var(--theme-surface-raised)]">
                  <th className="p-2 font-semibold text-[var(--theme-fg-muted)]">Feature</th>
                  <th className="p-2 font-semibold text-[var(--theme-fg-muted)]">Today</th>
                  <th className="p-2 font-semibold text-[var(--theme-fg)]">Today vs {TIER_DISPLAY_NAMES[nextTier]}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--theme-border)]">
                  <td className="p-2 text-[var(--theme-fg-muted)]">Recipes</td>
                  <td className="p-2 text-[var(--theme-fg-muted)]">{TIER_LIMITS[tier].recipes}</td>
                  <td className="p-2 text-[var(--theme-fg)] font-semibold">{TIER_LIMITS[nextTier].recipes}</td>
                </tr>
                <tr className="border-b border-[var(--theme-border)]">
                  <td className="p-2 text-[var(--theme-fg-muted)]">Cookbooks</td>
                  <td className="p-2 text-[var(--theme-fg-muted)]">{TIER_LIMITS[tier].cookbooks}</td>
                  <td className="p-2 text-[var(--theme-fg)] font-semibold">{TIER_LIMITS[nextTier].cookbooks}</td>
                </tr>
                <tr>
                  <td className="p-2 text-[var(--theme-fg-muted)]">Price</td>
                  <td className="p-2 text-[var(--theme-fg-muted)]">
                    {TIER_PRICING[tier].monthly === null ? 'Free' : `$${TIER_PRICING[tier].monthly}/mo`}
                  </td>
                  <td className="p-2 text-[var(--theme-fg)] font-semibold">
                    {TIER_PRICING[nextTier].monthly === null ? 'Free' : `$${TIER_PRICING[nextTier].monthly}/mo`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="flex gap-3 justify-end">
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="px-4 py-2 rounded-lg text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-surface-hover)] transition-colors"
            >
              Not now
            </button>
          )}
          <Link
            to="/pricing"
            className="px-4 py-2 rounded-lg bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-medium transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </div>
  )
}
