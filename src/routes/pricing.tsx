import { createFileRoute, Link } from "@tanstack/react-router"
import PageLayout from "@/components/layout/PageLayout"
import { useAuth } from "@/hooks/useAuth"
import {
  TIER_LIMITS,
  TIER_DESCRIPTIONS,
  TIER_ORDER,
  TIER_DISPLAY_NAMES,
  TIER_PRICING,
  showUserAds,
  type EntitlementTier,
  canCreatePrivate,
  canImport,
} from "@/lib/tier-entitlements"

export const Route = createFileRoute("/pricing")({ component: PricingPage })

interface TierCardProps {
  tier: EntitlementTier
  isCurrentTier: boolean
}

function TierCard({ tier, isCurrentTier }: TierCardProps) {
  const limits = TIER_LIMITS[tier]
  const pricing = TIER_PRICING[tier]
  const isPaidTier = pricing.annual !== null

  return (
    <div
      data-testid={`tier-card-${tier}`}
      data-current={isCurrentTier ? "true" : undefined}
      className={[
        "flex flex-col rounded-xl border p-6 text-center",
        isCurrentTier
          ? "border-[var(--theme-accent)] bg-[var(--theme-accent)]/5 ring-2 ring-[var(--theme-accent)]"
          : "border-[var(--theme-border)] bg-[var(--theme-surface)]",
      ].join(" ")}
    >
      {isCurrentTier && (
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
        {isPaidTier ? (
          <>
            <p className="text-base font-bold text-[var(--theme-fg)]">
              ${pricing.annual}/year
            </p>
            <p className="text-sm text-[var(--theme-fg-muted)]">
              ${pricing.monthly}/month
            </p>
            <p>
              <span className="inline-block rounded-full bg-[var(--theme-accent)] px-2 py-0.5 text-xs font-semibold text-white">
                Save 2 months
              </span>
            </p>
          </>
        ) : (
          <p className="text-base font-bold text-[var(--theme-fg)]">FREE</p>
        )}
      </div>
      <div className="mt-4 space-y-1 text-sm text-[var(--theme-fg-subtle)]">
        <p>
          <span className="font-semibold text-[var(--theme-fg)]">{limits.recipes}</span> recipes
        </p>
        <p>
          <span className="font-semibold text-[var(--theme-fg)]">{limits.cookbooks}</span> cookbooks
        </p>
        <p>{canCreatePrivate(tier) ? "Private recipes ✓" : "Public only"}</p>
        <p>{canImport(tier) ? "Import ✓" : "No import"}</p>
        <p>{showUserAds(tier) ? "Ad Supported" : "No Ads"}</p>
      </div>
    </div>
  )
}

export function PricingPage() {
  const { session } = useAuth()
  const rawTier = session?.user?.tier as EntitlementTier | undefined
  const currentTier: EntitlementTier = session
    ? (rawTier && Object.hasOwn(TIER_LIMITS, rawTier) ? rawTier : "home-cook")
    : "anonymous"
  const isAnon = currentTier === "anonymous"

  return (
    <PageLayout role="public-marketing" title="Pricing" description="Compare plans and find the right fit.">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 my-8">
        {TIER_ORDER.filter(t => t !== "anonymous").map((tier) => (
          <TierCard
            key={tier}
            tier={tier}
            isCurrentTier={tier === currentTier}
          />
        ))}
      </div>
      {isAnon && (
        <div className="mt-8 text-center">
          <Link
            to="/auth/register"
            className="inline-block rounded-md bg-[var(--theme-accent)] px-6 py-3 text-base font-semibold text-white hover:opacity-90"
          >
            Get Started for Free
          </Link>
        </div>
      )}
    </PageLayout>
  )
}
