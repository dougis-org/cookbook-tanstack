import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { requireVerifiedAuth } from '@/lib/auth-guard'
import PageLayout from '@/components/layout/PageLayout'
import RecipeForm from '@/components/recipes/RecipeForm'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useTierEntitlements } from '@/hooks/useTierEntitlements'
import TierWall from '@/components/ui/TierWall'
import UsageNudge from '@/components/ui/UsageNudge'

export const Route = createFileRoute('/recipes/new')({
  component: NewRecipePage,
  beforeLoad: requireVerifiedAuth(),
})

function NewRecipePage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { recipeLimit } = useTierEntitlements()

  const { data: ownedUsageData, isLoading } = useQuery({
    ...trpc.usage.getOwned.queryOptions(),
    enabled: isLoggedIn,
  })

  const myRecipeCount = ownedUsageData?.recipeCount ?? 0
  const isBlocked = isLoggedIn && !isLoading && ownedUsageData && myRecipeCount >= recipeLimit

  return (
    <PageLayout>
      <div className="mb-6">
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Recipes
        </Link>
      </div>

      {isLoggedIn && !isLoading && ownedUsageData && !isBlocked && (
        <div className="mb-6">
          <UsageNudge count={myRecipeCount} limit={recipeLimit} resourceName="recipe" />
        </div>
      )}

      {isBlocked && (
        <TierWall
          reason="count-limit"
          display="modal"
          onDismiss={() => navigate({ to: '/recipes' })}
        />
      )}

      <RecipeForm />
    </PageLayout>
  )
}

