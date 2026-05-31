import { useState } from "react"
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
import { RefreshCw, ShieldCheck, Download, ChevronDown, ChevronUp } from "lucide-react"

export const Route = createFileRoute("/pricing")({
  validateSearch: (search: Record<string, unknown>): { focus?: EntitlementTier } => ({
    focus: TIER_ORDER.find((t) => t === search.focus),
  }),
  component: PricingPage,
})

interface TierCardProps {
  tier: EntitlementTier
  isCurrentTier: boolean
  isAnnual: boolean
  currentTier: EntitlementTier
  isFocused?: boolean
}

function TierCard({ tier, isCurrentTier, isAnnual, currentTier, isFocused }: TierCardProps) {
  const limits = TIER_LIMITS[tier]
  const pricing = TIER_PRICING[tier]
  const isPaidTier = pricing.annual !== null
  const isPrepCook = tier === "prep-cook"

  const ctaText =
    currentTier === "anonymous"
      ? (tier === "home-cook" ? "Get Started" : "Select Plan")
      : (TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(currentTier) ? "Upgrade" : "Select Plan")

  return (
    <div
      data-testid={`tier-card-${tier}`}
      data-current={isCurrentTier ? "true" : undefined}
      data-focused={isFocused ? "true" : undefined}
      className={[
        "relative flex flex-col rounded-xl border p-6 text-center transition-all",
        isPrepCook
          ? "scale-105 border-[var(--theme-accent)] bg-[var(--theme-accent)]/5 ring-2 ring-[var(--theme-accent)] shadow-xl z-10"
          : isCurrentTier
          ? "border-[var(--theme-accent)] bg-[var(--theme-accent)]/5 ring-2 ring-[var(--theme-accent)]"
          : isFocused
          ? "border-[var(--theme-accent)] ring-2 ring-[var(--theme-accent)]/50 bg-[var(--theme-accent)]/2 scale-[1.02]"
          : "border-[var(--theme-border)] bg-[var(--theme-surface)] hover:border-[var(--theme-border)]/80",
      ].join(" ")}
    >
      {isPrepCook && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--theme-accent)] px-3 py-0.5 text-xs font-semibold text-white tracking-wide uppercase shadow-sm">
          Most popular
        </span>
      )}
      {!isPrepCook && isCurrentTier && (
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
              {'$' + (isAnnual ? (pricing.annual! / 12).toFixed(2) : pricing.monthly!.toFixed(2)) + '/mo'}
            </p>
            {isAnnual && (
              <p className="text-xs text-[var(--theme-fg-muted)]">
                Billed annually · {'$' + pricing.annual}/yr
              </p>
            )}
          </>
        ) : (
          <p className="text-base font-bold text-[var(--theme-fg)]">FREE</p>
        )}
      </div>
      <div className="mt-4 space-y-1 text-sm text-[var(--theme-fg-subtle)]">
        <p>
          <span className="font-semibold text-[var(--theme-fg)]">
            {limits.recipes}
          </span>{" "}
          recipes
        </p>
        <p>
          <span className="font-semibold text-[var(--theme-fg)]">
            {limits.cookbooks}
          </span>{" "}
          cookbooks
        </p>
        <p>{canCreatePrivate(tier) ? "Private recipes ✓" : "Public only"}</p>
        <p>{canImport(tier) ? "Import ✓" : "No import"}</p>
        <p>{showUserAds(tier) ? "Ad Supported" : "No Ads"}</p>
      </div>

      <div className="mt-auto pt-6">
        {isCurrentTier ? (
          <button
            type="button"
            disabled
            className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-border)]/5 text-[var(--theme-fg-muted)] px-4 py-2 text-sm font-semibold cursor-not-allowed"
          >
            Current plan
          </button>
        ) : (
          <Link
            to="/change-tier"
            className={[
              "inline-block w-full rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              isPrepCook
                ? "bg-[var(--theme-accent)] text-white hover:opacity-90 shadow-sm"
                : "border border-[var(--theme-border)] text-[var(--theme-fg)] hover:bg-[var(--theme-border)]/10"
            ].join(" ")}
          >
            {ctaText}
          </Link>
        )}
      </div>
    </div>
  )
}

const FAQ_ITEMS = [
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes, you can cancel your subscription at any time from your account settings. You will retain access to your paid features until the end of your active billing cycle."
  },
  {
    q: "What is the 30-day money-back guarantee?",
    a: "If you are not completely satisfied with My CookBooks within the first 30 days, simply contact our support team for a full, hassle-free refund."
  },
  {
    q: "Can I export my recipes?",
    a: "Yes, your recipes are yours. You can export all your recipes and cookbooks as JSON or structured files at any time, under any plan."
  },
  {
    q: "Is there a limit on how many recipes I can import?",
    a: "Under the Executive Chef plan, you can import unlimited recipes from any supported website with a single click. Other plans do not support automated importing."
  },
  {
    q: "How does the annual discount work?",
    a: "When you choose annual billing, you pay for 12 months upfront at a discounted rate, giving you the equivalent of 2 months completely free compared to monthly billing."
  }
]

export function PricingPage() {
  const { session } = useAuth()
  const { focus } = Route.useSearch()
  const rawTier = session?.user?.tier as EntitlementTier | undefined
  const currentTier: EntitlementTier = session
    ? (rawTier && Object.hasOwn(TIER_LIMITS, rawTier) ? rawTier : "home-cook")
    : "anonymous"

  const [isAnnual, setIsAnnual] = useState(true)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  return (
    <PageLayout role="public-marketing" title="Pricing" description="Compare plans and find the right fit for your kitchen.">
      <div className="flex flex-col items-center mt-6">
        <div
          className="flex items-center justify-center gap-4 mb-8"
          data-testid="billing-toggle"
        >
          <span id="billing-frequency-label" className="text-sm font-medium text-[var(--theme-fg-muted)]">
            Billing Frequency:
          </span>
          <div
            role="radiogroup"
            aria-labelledby="billing-frequency-label"
            className="inline-flex rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] p-1"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                if (isAnnual) {
                  setIsAnnual(false)
                  const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]')
                  buttons[0]?.focus()
                }
              } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                if (!isAnnual) {
                  setIsAnnual(true)
                  const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]')
                  buttons[1]?.focus()
                }
              }
            }}
          >
            <button
              type="button"
              role="radio"
              aria-checked={!isAnnual}
              tabIndex={!isAnnual ? 0 : -1}
              onClick={() => setIsAnnual(false)}
              className={[
                "px-4 py-1.5 text-xs font-semibold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]",
                !isAnnual
                  ? "bg-[var(--theme-accent)] text-white shadow-sm"
                  : "text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)]"
              ].join(" ")}
            >
              Monthly
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isAnnual}
              tabIndex={isAnnual ? 0 : -1}
              onClick={() => setIsAnnual(true)}
              className={[
                "px-4 py-1.5 text-xs font-semibold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]",
                isAnnual
                  ? "bg-[var(--theme-accent)] text-white shadow-sm"
                  : "text-[var(--theme-fg-muted)] hover:text-[var(--theme-fg)]"
              ].join(" ")}
            >
              Annual
            </button>
          </div>
          {isAnnual && (
            <span className="inline-block rounded-full bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] px-3 py-1 text-xs font-semibold border border-[var(--theme-accent)]/20 animate-pulse">
              Save 2 months
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 my-8">
        {TIER_ORDER.filter(t => t !== "anonymous").map((tier) => (
          <TierCard
            key={tier}
            tier={tier}
            isCurrentTier={tier === currentTier}
            isAnnual={isAnnual}
            currentTier={currentTier}
            isFocused={tier === focus}
          />
        ))}
      </div>

      <div className="mt-16 border-t border-[var(--theme-border)] pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center p-4">
            <div className="rounded-full bg-[var(--theme-accent)]/10 p-3 text-[var(--theme-accent)] mb-4">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--theme-fg)]">Cancel anytime</h3>
            <p className="mt-2 text-sm text-[var(--theme-fg-muted)]">
              Switch plans or cancel your subscription at any time with no questions asked.
            </p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="rounded-full bg-[var(--theme-accent)]/10 p-3 text-[var(--theme-accent)] mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--theme-fg)]">30-day guarantee</h3>
            <p className="mt-2 text-sm text-[var(--theme-fg-muted)]">
              Not happy? Let us know within 30 days and get a full refund on any paid tier.
            </p>
          </div>
          <div className="flex flex-col items-center p-4">
            <div className="rounded-full bg-[var(--theme-accent)]/10 p-3 text-[var(--theme-accent)] mb-4">
              <Download className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--theme-fg)]">Export anytime</h3>
            <p className="mt-2 text-sm text-[var(--theme-fg-muted)]">
              Your recipes are yours. Export your complete data as structured files whenever you want.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-20 max-w-3xl mx-auto border-t border-[var(--theme-border)] pt-12 pb-16">
        <h2 className="text-2xl font-bold text-center text-[var(--theme-fg)] mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;
            const headingId = `faq-heading-${index}`;
            const panelId = `faq-panel-${index}`;
            return (
              <div
                key={index}
                className="border border-[var(--theme-border)] rounded-lg overflow-hidden bg-[var(--theme-surface)]"
              >
                <button
                  type="button"
                  id={headingId}
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-[var(--theme-fg)] hover:bg-[var(--theme-border)]/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? panelId : undefined}
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-[var(--theme-fg-muted)]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[var(--theme-fg-muted)]" />
                  )}
                </button>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headingId}
                    className="px-6 pb-4 pt-2 text-sm text-[var(--theme-fg-muted)] border-t border-[var(--theme-border)]/5 bg-[var(--theme-border)]/2 animate-fadeIn"
                  >
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </PageLayout>
  )
}
