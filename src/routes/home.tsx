import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, BookOpen, Layers, Settings, ChefHat, Download, Lock, ArrowRight } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import { requireAuth } from '@/lib/auth-guard'
import { useAuth } from '@/hooks/useAuth'
import { useTierEntitlements } from '@/hooks/useTierEntitlements'
import { trpc } from '@/lib/trpc'
import RecipeCard from '@/components/recipes/RecipeCard'
import { TIER_DISPLAY_NAMES, TIER_PRICING } from '@/lib/tier-entitlements'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/home')({
  beforeLoad: requireAuth(),
  component: HomePageComponent,
})

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-2 w-full rounded-full bg-[var(--theme-border)] overflow-hidden">
      <div
        className="h-2 rounded-full bg-[var(--theme-accent)] transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function HomePageComponent() {
  const { session, isLoggedIn } = useAuth()
  const { tier, recipeLimit, cookbookLimit, canImport } = useTierEntitlements()
  const displayName = TIER_DISPLAY_NAMES[tier] || 'Home Cook'
  const prepCookPrice = TIER_PRICING['prep-cook'].monthly?.toFixed(2) ?? '2.99'

  const firstName = session?.user?.name?.trim()?.split(/\s+/)[0] || 'Chef'

  // Hydration and Client Mount state
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const formattedDate = isMounted
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date())
    : ''

  // Query usage counts
  const { data: usage, isLoading: isUsageLoading } = useQuery({
    ...trpc.usage.getOwned.queryOptions(),
    enabled: isLoggedIn,
  })

  // Query recent recipes (paginated to 4 for performance / overfetching prevention)
  const { data: recentRecipesData, isLoading: isRecentLoading } = useQuery({
    ...trpc.recipes.list.queryOptions({ userId: session?.user?.id, sort: 'newest', pageSize: 4 }),
    enabled: isLoggedIn,
  })

  // Query all user recipes for accurate "This Month" count (safe to fetch up to 100 for plan limits)
  const { data: allRecipesData, isLoading: isAllLoading } = useQuery({
    ...trpc.recipes.list.queryOptions({ userId: session?.user?.id, sort: 'newest', pageSize: 100 }),
    enabled: isLoggedIn,
  })

  // Combined Loading state to prevent flashing incorrect counts
  const isLoading = isUsageLoading || isAllLoading

  // Recipes saved in the current calendar month
  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() // 0-indexed
  const thisMonthRecipes = (allRecipesData?.items ?? []).filter((r) => {
    if (!r.createdAt) return false
    const d = new Date(r.createdAt)
    return d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth
  })
  const thisMonthCount = thisMonthRecipes.length

  // Sliced recipes for display
  const recentRecipes = recentRecipesData?.items ?? []

  // Contextual Nudge Logic
  let lastPaidAttemptStr = null
  if (isMounted) {
    try {
      lastPaidAttemptStr = localStorage.getItem('last_paid_action_attempt')
    } catch {
      // Handle blocked/disabled storage in privacy modes
    }
  }

  let attemptedPaidActionRecently = false
  if (lastPaidAttemptStr) {
    const attemptDate = new Date(lastPaidAttemptStr)
    const timeDiff = new Date().getTime() - attemptDate.getTime()
    const daysDiff = timeDiff / (1000 * 3600 * 24)
    if (daysDiff >= 0 && daysDiff < 7) {
      attemptedPaidActionRecently = true
    }
  }

  const isCookbookLimitReached = (usage?.cookbookCount ?? 0) >= cookbookLimit
  const isRecipeLimitApproaching = (usage?.recipeCount ?? 0) >= recipeLimit * 0.8

  let nudgeMessage = ''
  if (isCookbookLimitReached) {
    nudgeMessage = 'Ready to build a second cookbook? Upgrade to Prep Cook.'
  } else if (isRecipeLimitApproaching) {
    nudgeMessage = 'Running out of room? Upgrade to Prep Cook to save up to 100 recipes.'
  } else if (attemptedPaidActionRecently) {
    nudgeMessage = 'Unlock premium capabilities with Prep Cook.'
  }

  // Restrict nudge visibility to home-cook tier to avoid showing downgrade recommendations to higher tiers
  const isHomeCook = tier === 'home-cook'
  const showNudge = isMounted && isHomeCook && nudgeMessage !== ''

  return (
    <PageLayout role="authenticated-home" title="Welcome Home">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header Greeting Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--theme-border)] pb-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold text-[var(--theme-fg)] tracking-tight">
              Welcome back, <span className="text-[var(--theme-accent)]">{firstName}</span>
            </h2>
            <div className="h-5 flex items-center">
              {isMounted ? (
                <p className="text-sm text-[var(--theme-fg-subtle)] flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-[var(--theme-accent)]" />
                  Today is {formattedDate}
                </p>
              ) : (
                <div className="h-4 w-48 bg-[var(--theme-border)]/30 animate-pulse rounded" />
              )}
            </div>
          </div>
        </div>

        {/* Usage Card Metrics Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="usage-loading">
            <div className="h-32 bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] animate-pulse" />
            <div className="h-32 bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] animate-pulse" />
            <div className="h-32 bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recipes Usage */}
            <Link
              to="/recipes"
              data-testid="recipes-usage-tile-link"
              className="block p-6 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-sm space-y-4 hover:border-[var(--theme-accent)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg)] transition-colors"
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-[var(--theme-fg-subtle)] uppercase tracking-wider">Recipes</span>
                <span className="text-lg font-bold text-[var(--theme-fg)]">{usage?.recipeCount ?? 0} of {recipeLimit}</span>
              </div>
              <ProgressBar value={usage?.recipeCount ?? 0} max={recipeLimit} />
              <p className="text-xs text-[var(--theme-fg-muted)]">{displayName}</p>
            </Link>

            {/* Cookbooks Usage */}
            <Link
              to="/cookbooks"
              data-testid="cookbooks-usage-tile-link"
              className="block p-6 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-sm space-y-4 hover:border-[var(--theme-accent)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--theme-bg)] transition-colors"
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-[var(--theme-fg-subtle)] uppercase tracking-wider">Cookbooks</span>
                <span className="text-lg font-bold text-[var(--theme-fg)]">{usage?.cookbookCount ?? 0} of {cookbookLimit}</span>
              </div>
              <ProgressBar value={usage?.cookbookCount ?? 0} max={cookbookLimit} />
              <p className="text-xs text-[var(--theme-fg-muted)]">{displayName}</p>
            </Link>

            {/* Creations This Month */}
            <div className="p-6 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-sm flex flex-col justify-between hover:border-[var(--theme-accent)]/50 transition-colors min-h-[120px]">
              <span className="text-sm font-semibold text-[var(--theme-fg-subtle)] uppercase tracking-wider block">This Month</span>
              <div className="mt-2">
                <span className="text-3xl font-extrabold text-[var(--theme-accent)]">{thisMonthCount} saved</span>
              </div>
              <p className="text-xs text-[var(--theme-fg-muted)] mt-1">{displayName}</p>
            </div>
          </div>
        )}

        {/* Dashboard Actions and Recipes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions (1/3 width) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[var(--theme-fg)] tracking-tight">Quick Actions</h2>
            <div className="flex flex-col gap-4">
              {/* Create Recipe */}
              <Link
                to="/recipes/new"
                className="flex items-start gap-4 p-5 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-sm hover:border-[var(--theme-accent)] hover:shadow-md transition-all group"
              >
                <div className="p-3 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-lg group-hover:bg-[var(--theme-accent)] group-hover:text-white transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors">Create Recipe</h3>
                  <p className="text-sm text-[var(--theme-fg-subtle)] mt-1">Add a new recipe to your collection</p>
                </div>
              </Link>

              {/* Import Recipe */}
              {canImport ? (
                <Link
                  to="/import"
                  data-testid="import-recipe-link"
                  className="flex items-start gap-4 p-5 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-sm hover:border-[var(--theme-accent)] hover:shadow-md transition-all group"
                >
                  <div className="p-3 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-lg group-hover:bg-[var(--theme-accent)] group-hover:text-white transition-colors">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--theme-fg)] group-hover:text-[var(--theme-accent)] transition-colors">Import Recipe</h3>
                    <p className="text-sm text-[var(--theme-fg-subtle)] mt-1">Import from a URL</p>
                  </div>
                </Link>
              ) : (
                <div
                  data-testid="import-recipe-link"
                  aria-disabled="true"
                  role="link"
                  className="flex items-start gap-4 p-5 bg-[var(--theme-surface)]/40 border border-[var(--theme-border)] rounded-xl shadow-inner pointer-events-none opacity-60 relative overflow-hidden"
                >
                  <div className="p-3 bg-[var(--theme-fg-muted)]/10 text-[var(--theme-fg-muted)] rounded-lg">
                    <Lock className="w-5 h-5 text-[var(--theme-fg-muted)]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[var(--theme-fg-muted)]">Import Recipe</h3>
                      <span data-testid="executive-chef-badge" className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] rounded-full">
                        {TIER_DISPLAY_NAMES['executive-chef']}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--theme-fg-muted)] mt-1">Import from a URL</p>
                  </div>
                </div>
              )}
            </div>

            {/* Discovery Directory Menu */}
            <div className="space-y-4 pt-4 border-t border-[var(--theme-border)]">
              <h2 className="text-lg font-bold text-[var(--theme-fg)] tracking-tight">Discovery</h2>
              <div className="flex flex-col gap-2">
                <Link
                  to="/recipes"
                  className="flex items-center gap-3 p-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg hover:border-[var(--theme-accent)] transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-[var(--theme-accent)]" />
                  <span className="font-medium text-[var(--theme-fg)] text-sm">All Recipes</span>
                </Link>
                <Link
                  to="/cookbooks"
                  className="flex items-center gap-3 p-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg hover:border-[var(--theme-accent)] transition-colors"
                >
                  <Layers className="w-5 h-5 text-[var(--theme-accent)]" />
                  <span className="font-medium text-[var(--theme-fg)] text-sm">Cookbooks</span>
                </Link>
                <Link
                  to="/categories"
                  className="flex items-center gap-3 p-4 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg hover:border-[var(--theme-accent)] transition-colors"
                >
                  <Settings className="w-5 h-5 text-[var(--theme-accent)]" />
                  <span className="font-medium text-[var(--theme-fg)] text-sm">Categories</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recently Saved Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--theme-border)]">
              <h2 className="text-xl font-bold text-[var(--theme-fg)] tracking-tight">Recently Saved</h2>
              <Link to="/recipes" className="text-sm font-semibold text-[var(--theme-accent)] hover:underline flex items-center gap-1 group">
                View all <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {isRecentLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
                <div className="h-64 bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)]" />
                <div className="h-64 bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)]" />
              </div>
            ) : recentRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-[var(--theme-surface)] border-2 border-dashed border-[var(--theme-border)] rounded-xl text-center space-y-3 min-h-[300px]">
                <div className="p-4 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] rounded-full">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[var(--theme-fg)]">No recipes saved yet</h3>
                <p className="text-sm text-[var(--theme-fg-subtle)] max-w-sm">
                  Create or import your first recipe to get started!
                </p>
                <Link
                  to="/recipes/new"
                  className="mt-4 px-5 py-2.5 bg-[var(--theme-accent)] text-white hover:bg-[var(--theme-accent)]/90 rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  Create Your First Recipe
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {recentRecipes.map((recipe) => (
                  <Link key={recipe.id} to="/recipes/$recipeId" params={{ recipeId: recipe.id }} className="block hover:scale-[1.01] transition-transform">
                    <RecipeCard recipe={recipe} isOwner={true} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Contextual Nudge Banner */}
        {showNudge && (
          <div className="p-6 bg-gradient-to-r from-[var(--theme-surface)] to-[var(--theme-surface-hover)] border border-[var(--theme-accent)]/30 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[var(--theme-accent)]/60 transition-all duration-300">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-lg font-extrabold text-[var(--theme-fg)] tracking-tight">Upgrade Your Plan</h3>
              <p className="text-sm text-[var(--theme-fg-subtle)] font-medium">{nudgeMessage}</p>
            </div>
            <Link
              to="/pricing"
              className="px-6 py-3 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/95 text-white font-bold rounded-xl shadow-lg hover:shadow-[var(--theme-accent)]/20 transition-all text-sm shrink-0 uppercase tracking-wider"
            >
              Upgrade — ${prepCookPrice}/mo
            </Link>
          </div>
        )}

      </div>
    </PageLayout>
  )
}
