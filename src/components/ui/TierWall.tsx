import { useCallback, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'

type TierWallReason = 'count-limit' | 'private-content' | 'import'

interface TierWallProps {
  reason: TierWallReason
  display: 'inline' | 'modal'
  onDismiss?: () => void
}

const MESSAGES: Record<TierWallReason, { title: string; body: string }> = {
  'count-limit': {
    title: 'Plan limit reached',
    body: "You've reached the recipe or cookbook limit for your current plan.",
  },
  'private-content': {
    title: 'Private content requires Sous Chef',
    body: 'Private recipes and cookbooks require Sous Chef tier or above.',
  },
  'import': {
    title: 'Import requires Sous Chef',
    body: 'Recipe import requires Sous Chef tier or above.',
  },
}

const UpgradeLink = () => (
  <Link to="/pricing" className="underline font-medium text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)]">
    Upgrade
  </Link>
)

function InlineTierWall({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-sm text-amber-400 bg-amber-950/40 rounded-md px-3 py-2 border border-amber-800/50">
      <span className="font-medium">{title}.</span>{' '}
      {body}{' '}
      <UpgradeLink /> to unlock more.
    </div>
  )
}

function ModalTierWall({ title, body, onDismiss }: { title: string; body: string; onDismiss?: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
    modalRef.current?.focus()
    return () => {
      previousFocusRef.current?.focus()
    }
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onDismiss?.()
    }
  }, [onDismiss])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onDismiss?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tier-wall-title"
      aria-describedby="tier-wall-description"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl outline-none"
      >
        <h2 id="tier-wall-title" className="text-lg font-bold text-[var(--theme-fg)] mb-2">{title}</h2>
        <p id="tier-wall-description" className="text-[var(--theme-fg-muted)] mb-6">{body}</p>
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

export default function TierWall({ reason, display, onDismiss }: TierWallProps) {
  const { title, body } = MESSAGES[reason]
  return display === 'inline'
    ? <InlineTierWall title={title} body={body} />
    : <ModalTierWall title={title} body={body} onDismiss={onDismiss} />
}
