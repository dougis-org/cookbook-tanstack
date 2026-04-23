import { createFileRoute, Link } from "@tanstack/react-router"
import PageLayout, { AdSlot } from "@/components/layout/PageLayout"
import { useAuth } from "@/hooks/useAuth"
import {
  TIER_LIMITS,
  TIER_DESCRIPTIONS,
  type EntitlementTier,
  canCreatePrivate,
  canImport,
} from "@/lib/tier-entitlements"
import { isPageAdEligible } from "@/lib/ad-policy"

export const Route = createFileRoute("/pricing")({ component: PricingPage })

const TIER_ORDER: EntitlementTier[] = [
  "anonymous",
  "home-cook",
  "prep-cook",
  "sous-chef",
  "executive-chef",
]

const TIER_DISPLAY_NAMES: Record<EntitlementTier, string> = {
  anonymous: "Anonymous",
  "home-cook": "Home Cook",
  "prep-cook": "Prep Cook",
  "sous-chef": "Sous Chef",
  "executive-chef": "Executive Chef",
}

interface TierCardProps {
  tier: EntitlementTier
  isCurrent: boolean
  isAnon: boolean
}

function TierCard({ tier, isCurrent, isAnon }: TierCardProps) {
  const limits = TIER_LIMITS[tier]
  const isTopTier = tier === "executive-chef"

  function renderCTA() {
    if (tier === "anonymous") return null
    if (isTopTier) {
      return (
        <p className="text-sm font-medium text-[var(--theme-fg-muted)] mt-4">
          Maximum plan
        </p>
      )
    }
    if (isAnon) {
      return (
        <Link
          to="/auth/register"
          className="mt-4 inline-block rounded-md bg-[var(--theme-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Get started free
        </Link>
      )
    }
    return (
      <Link
        to="/upgrade"
        className="mt-4 inline-block rounded-md border border-[var(--theme-accent)] px-4 py-2 text-sm font-semibold text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10"
      >
        Upgrade
      </Link>
    )
  }

  return (
    <div
      data-testid={`tier-card-${tier}`}
      data-current={isCurrent ? "true" : undefined}
      className={[
        "flex flex-col rounded-xl border p-6 text-center",
        isCurrent
          ? "border-[var(--theme-accent)] bg-[var(--theme-accent)]/5 ring-2 ring-[var(--theme-accent)]"
          : "border-[var(--theme-border)] bg-[var(--theme-surface)]",
      ].join(" ")}
    >
      {isCurrent && (
        <span className="mb-2 inline-block rounded-full bg-[var(--theme-accent)] px-3 py-0.5 text-xs font-semibold text-white">
          Current plan
        </span>
      )}
      <h2 className="text-lg font-bold text-[var(--theme-fg)]">
        {TIER_DISPLAY_NAMES[tier]}
      </h2>
      <p
        data-testid="tier-description"
        className="mt-2 text-sm text-[var(--theme-fg-muted)]"
      >
        {TIER_DESCRIPTIONS[tier]}
      </p>
      <div className="mt-4 space-y-1 text-sm text-[var(--theme-fg-subtle)]">
        <p>
          <span className="font-semibold text-[var(--theme-fg)]">{limits.recipes}</span> recipes
        </p>
        <p>
          <span className="font-semibold text-[var(--theme-fg)]">{limits.cookbooks}</span> cookbooks
        </p>
        <p>{canCreatePrivate(tier) ? "Private recipes ✓" : "Public only"}</p>
        <p>{canImport(tier) ? "Import ✓" : "No import"}</p>
      </div>
      {renderCTA()}
    </div>
  )
}

export function PricingPage() {
  const { session } = useAuth()
  const currentTier = (session?.user?.tier as EntitlementTier | undefined) ?? undefined
  const showAds = isPageAdEligible("public-marketing", session ? { user: session.user } : null)

  return (
    <PageLayout title="Pricing" description="Compare plans and find the right fit.">
      {showAds && <AdSlot role="public-marketing" position="top" />}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 my-8">
        {TIER_ORDER.map((tier) => (
          <TierCard
            key={tier}
            tier={tier}
            isCurrent={currentTier === tier}
            isAnon={!session}
          />
        ))}
      </div>
      {showAds && <AdSlot role="public-marketing" position="bottom" />}
    </PageLayout>
  )
}
