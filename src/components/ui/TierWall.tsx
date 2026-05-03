import { useEffect, useRef, useId } from 'react'
import { Link } from '@tanstack/react-router'
import type { TierWallReason } from '@/lib/trpc-error'

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
