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
  <Link to="/pricing" className="underline font-medium text-cyan-400 hover:text-cyan-300">
    Upgrade
  </Link>
)

export default function TierWall({ reason, display, onDismiss }: TierWallProps) {
  const { title, body } = MESSAGES[reason]

  if (display === 'inline') {
    return (
      <div className="text-sm text-amber-400 bg-amber-950/40 rounded-md px-3 py-2 border border-amber-800/50">
        <span className="font-medium">{title}.</span>{' '}
        {body}{' '}
        <UpgradeLink /> to unlock more.
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-300 mb-6">{body}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            Not now
          </button>
          <Link
            to="/pricing"
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </div>
  )
}
