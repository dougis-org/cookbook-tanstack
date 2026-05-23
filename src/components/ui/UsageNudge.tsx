import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { X, AlertTriangle } from 'lucide-react'
import { useTierEntitlements } from '@/hooks/useTierEntitlements'
import { useAuth } from '@/hooks/useAuth'
import { getSoftNudgeText, getLoudNudgeText, getLoudNudgeCTA, getNextTier } from '@/lib/nudgeCopy'

interface UsageNudgeProps {
  count: number
  limit: number
  resourceName: 'recipe' | 'cookbook'
}

export default function UsageNudge({ count, limit, resourceName }: UsageNudgeProps) {
  const { isLoggedIn } = useAuth()
  const { tier } = useTierEntitlements()
  const [dismissed, setDismissed] = useState(true) // Default to true, check in useEffect to avoid hydration mismatch

  const sessionKey = `nudge_dismissed_${resourceName}`

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = sessionStorage.getItem(sessionKey) === 'true'
      setDismissed(isDismissed)
    }
  }, [sessionKey])

  if (!isLoggedIn) return null
  if (limit <= 0) return null

  const ratio = count / limit

  // Soft Nudge: 70% to 89% capacity
  const isSoft = ratio >= 0.7 && ratio < 0.9
  // Loud Nudge: 90% to 99% capacity
  const isLoud = ratio >= 0.9 && ratio < 1.0

  if (!isSoft && !isLoud) return null
  if (isSoft && dismissed) return null

  const nextTier = getNextTier(tier)

  const handleDismiss = () => {
    sessionStorage.setItem(sessionKey, 'true')
    setDismissed(true)
  }

  if (isSoft) {
    return (
      <div
        className="flex items-center justify-between p-3 rounded-lg border text-sm transition-all duration-300"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)',
          borderColor: 'color-mix(in srgb, var(--theme-accent) 30%, transparent)',
          color: 'var(--theme-fg)',
        }}
      >
        <div className="flex items-center gap-2">
          <span>
            {getSoftNudgeText(count, limit, resourceName)}{' '}
            <Link
              to="/pricing"
              className="underline font-semibold hover:opacity-80 transition-opacity"
              style={{ color: 'var(--theme-accent)' }}
            >
              View plan
            </Link>
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)] transition-colors"
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Loud Nudge
  return (
    <div className="p-4 rounded-xl border border-[var(--theme-warning-border)] bg-[var(--theme-warning-bg)] text-[var(--theme-fg)] transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-[var(--theme-warning)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm leading-none">
                {getLoudNudgeText(count, limit, tier, resourceName)}
              </p>
              <div className="w-full bg-[color-mix(in srgb,var(--theme-warning)20%,transparent)] h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-[var(--theme-warning)] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {nextTier && (
          <Link
            to="/pricing"
            className="px-4 py-2 rounded-lg bg-[var(--theme-warning)] hover:opacity-90 text-white text-sm font-semibold transition-all shadow-sm text-center"
          >
            {getLoudNudgeCTA(nextTier)}
          </Link>
        )}
      </div>
    </div>
  )
}
