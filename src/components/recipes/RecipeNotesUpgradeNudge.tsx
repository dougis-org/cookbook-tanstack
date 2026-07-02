import { Lock } from "lucide-react"
import { Link } from "@tanstack/react-router"

interface Props {
  state: "anonymous" | "below-tier" | "hidden-by-downgrade"
}

const CONTENT = {
  anonymous: {
    copy: "Login or register to save private notes on any recipe.",
    ctaLabel: "Login",
    ctaTo: "/auth/login",
  },
  "below-tier": {
    copy: "Private notes are part of Sous Chef. Upgrade to add notes to any recipe you can view.",
    ctaLabel: "Upgrade",
    ctaTo: "/pricing",
  },
  "hidden-by-downgrade": {
    copy: "Your notes are saved. Upgrade to Sous Chef to see and edit them again.",
    ctaLabel: "Upgrade",
    ctaTo: "/pricing",
  },
} as const

export default function RecipeNotesUpgradeNudge({ state }: Props) {
  const { copy, ctaLabel, ctaTo } = CONTENT[state]

  return (
    <div
      className="up-card flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm text-[var(--theme-fg-muted)]"
    >
      <Lock size={16} className="shrink-0 text-[var(--theme-fg-subtle)]" aria-hidden="true" />
      <span className="up-body">{copy}</span>
      <Link
        to={ctaTo}
        className="up-cta ml-auto shrink-0 font-medium text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
