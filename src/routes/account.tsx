import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { User } from "lucide-react"
import type { RedirectReason } from "@/lib/auth-guard"
import { REDIRECT_REASON_MESSAGES, requireAuth } from "@/lib/auth-guard"
import PageLayout from "@/components/layout/PageLayout"
import { useAuth } from "@/hooks/useAuth"
import { trpc } from "@/lib/trpc"
import {
  TIER_LIMITS,
  TIER_DESCRIPTIONS,
  TIER_ORDER,
  TIER_DISPLAY_NAMES,
  type EntitlementTier,
} from "@/lib/tier-entitlements"

export const Route = createFileRoute("/account")({
  beforeLoad: requireAuth(),
  component: AccountPage,
  validateSearch: (search: Record<string, unknown>): { reason?: RedirectReason } => ({
    reason:
      search.reason === "auth-required" || search.reason === "tier-limit-reached"
        ? search.reason
        : undefined,
  }),
})

const USER_TIER_ORDER = TIER_ORDER.filter((t) => t !== "anonymous") as Exclude<EntitlementTier, "anonymous">[]

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-2 w-full rounded-full bg-[var(--theme-border)]">
      <div
        className="h-2 rounded-full bg-[var(--theme-accent)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function AccountPage() {
  const { reason } = Route.useSearch()
  const { session } = useAuth()
  const rawTier = session?.user?.tier as EntitlementTier | undefined
  const tier: EntitlementTier = rawTier && Object.hasOwn(TIER_LIMITS, rawTier)
    ? rawTier
    : "home-cook"
  const limits = TIER_LIMITS[tier]
  const description = TIER_DESCRIPTIONS[tier]
  const displayName = TIER_DISPLAY_NAMES[tier]

  const nextTierIndex = USER_TIER_ORDER.indexOf(tier as Exclude<EntitlementTier, "anonymous">) + 1
  const nextTier: EntitlementTier | null =
    nextTierIndex < USER_TIER_ORDER.length ? USER_TIER_ORDER[nextTierIndex] : null

  const { data: usage, isLoading, isError } = useQuery({
    ...trpc.usage.getOwned.queryOptions(),
    enabled: !!session,
  })

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="flex items-center gap-4 mb-8">
          <User className="w-12 h-12 text-[var(--theme-accent)]" />
          <h1 className="text-3xl font-bold text-[var(--theme-fg)]">Account</h1>
        </div>

        {reason && (
          <p className="text-[var(--theme-fg-muted)] mb-6">
            {REDIRECT_REASON_MESSAGES[reason]}
          </p>
        )}

        {/* Tier section */}
        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--theme-fg)]">{displayName}</h2>
            <p data-testid="tier-description" className="mt-1 text-sm text-[var(--theme-fg-muted)]">
              {description}
            </p>
          </div>

          {isLoading ? (
            <div data-testid="usage-loading" className="animate-pulse space-y-3">
              <div className="h-4 w-3/4 rounded bg-[var(--theme-border)]" />
              <div className="h-2 w-full rounded bg-[var(--theme-border)]" />
              <div className="h-4 w-3/4 rounded bg-[var(--theme-border)]" />
              <div className="h-2 w-full rounded bg-[var(--theme-border)]" />
            </div>
          ) : isError ? (
            <p data-testid="usage-error" className="text-sm text-[var(--theme-fg-muted)]">
              Unable to load usage data. Please try again later.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-[var(--theme-fg-muted)] mb-1">
                  <span>Recipes</span>
                  <span>{usage?.recipeCount ?? 0} of {limits.recipes}</span>
                </div>
                <ProgressBar value={usage?.recipeCount ?? 0} max={limits.recipes} />
              </div>
              <div>
                <div className="flex justify-between text-sm text-[var(--theme-fg-muted)] mb-1">
                  <span>Cookbooks</span>
                  <span>{usage?.cookbookCount ?? 0} of {limits.cookbooks}</span>
                </div>
                <ProgressBar value={usage?.cookbookCount ?? 0} max={limits.cookbooks} />
              </div>
            </div>
          )}

          {nextTier && (
            <div data-testid="next-tier-preview" className="rounded-lg bg-[var(--theme-bg)] p-4 text-sm">
              <p className="font-semibold text-[var(--theme-fg)] mb-1">
                Next tier: {TIER_DISPLAY_NAMES[nextTier]}
              </p>
              <p className="text-[var(--theme-fg-muted)]">
                {TIER_LIMITS[nextTier].recipes} recipes · {TIER_LIMITS[nextTier].cookbooks} cookbooks
              </p>
            </div>
          )}

          <Link
            to="/pricing"
            className="inline-block text-sm text-[var(--theme-accent)] hover:underline"
          >
            View pricing plans
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
