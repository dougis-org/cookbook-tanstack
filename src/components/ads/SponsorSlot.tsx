import { Link } from '@tanstack/react-router'
import { showUserAds, TIER_PRICING } from '@/lib/tier-entitlements'
import type { EntitlementTier } from '@/lib/tier-entitlements'

interface SponsorSlotProps {
  tier: EntitlementTier | 'anonymous'
}

const prepCookMonthly = TIER_PRICING['prep-cook'].monthly

export default function SponsorSlot({ tier }: SponsorSlotProps) {
  if (!showUserAds(tier)) return null

  return (
    <div
      className="up-card relative flex items-center gap-4 rounded-lg border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)] px-5 py-3.5 before:absolute before:-top-2 before:left-4 before:bg-[var(--theme-bg)] before:px-1.5 before:text-[10px] before:font-semibold before:uppercase before:tracking-[.12em] before:text-[var(--theme-fg-subtle)] before:content-['Sponsored']"
      data-testid="up-slot"
    >
      <div className="up-media h-14 w-14 flex-shrink-0 rounded-md bg-gradient-to-br from-amber-400 to-amber-700" />
      <div className="up-body min-w-0 flex-1">
        <div className="mb-0.5 text-sm font-semibold text-[var(--theme-fg)]">
          Remove sponsors → Prep Cook
        </div>
        <div className="truncate text-xs text-[var(--theme-fg-subtle)]">
          Upgrade to Prep Cook for a sponsor-free experience.
        </div>
      </div>
      <div className="up-cta flex flex-shrink-0 flex-col items-end gap-1 border-l border-[var(--theme-border-muted)] pl-4">
        <Link
          to="/pricing"
          className="up-cta-link whitespace-nowrap text-xs font-medium text-[var(--theme-accent)] no-underline"
        >
          Upgrade
        </Link>
        {prepCookMonthly !== null && (
          <span className="up-cta-price text-[11px] text-[var(--theme-fg-subtle)]">
            ${prepCookMonthly.toFixed(2)}/mo
          </span>
        )}
      </div>
    </div>
  )
}
