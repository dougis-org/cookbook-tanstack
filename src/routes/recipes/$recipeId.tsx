import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/hooks/useAuth'
import PageLayout from '@/components/layout/PageLayout'
import RecipeDetail from '@/components/recipes/RecipeDetail'
import RelatedRecipesSection from '@/components/recipes/RelatedRecipesSection'
import DeleteConfirmModal from '@/components/recipes/DeleteConfirmModal'
import ExportButton from '@/components/recipes/ExportButton'
import Breadcrumb from '@/components/ui/Breadcrumb'
import PrintButton from '@/components/ui/PrintButton'

export const Route = createFileRoute('/recipes/$recipeId')({
  component: RecipeDetailPage,
})

export function RecipeDetailPage() {
  const { recipeId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isLoggedIn, userId } = useAuth()
  const [showDelete, setShowDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | undefined>()

  const { data: recipe, isLoading } = useQuery(
    trpc.recipes.byId.queryOptions({ id: recipeId }),
  )

  const toggleMarkedMutation = useMutation(
    trpc.recipes.toggleMarked.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.recipes.byId.queryOptions({ id: recipeId }).queryKey,
        })
        queryClient.invalidateQueries({ queryKey: [['recipes']] })
      },
    }),
  )

  const deleteMutation = useMutation(
    trpc.recipes.delete.mutationOptions({
      onSuccess: () => {
        setDeleteError(undefined)
        queryClient.invalidateQueries({ queryKey: [['recipes']] })
        navigate({ to: '/recipes' })
      },
      onError: (err) => setDeleteError(err.message),
    }),
  )

  const isOwner = userId === recipe?.userId

  if (isLoading) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-[var(--theme-fg-subtle)]">Loading recipe...</p>
        </div>
      </PageLayout>
    )
  }

  if (!recipe) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-[var(--theme-fg-subtle)] mb-4">Recipe not found</p>
          <Link
            to="/recipes"
            className="text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors"
          >
            Back to Recipes
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="print:hidden">
        <Breadcrumb items={[{ label: 'Recipes', to: '/recipes' }, { label: recipe.name }]} />
      </div>
      <div className="mb-6 flex items-center justify-between">
        <span />

        {isLoggedIn && (
          <button
            onClick={() => toggleMarkedMutation.mutate({ id: recipeId })}
            disabled={toggleMarkedMutation.isPending}
            className="print:hidden inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--theme-border)] text-[var(--theme-fg-muted)] hover:bg-[var(--theme-surface-hover)] transition-colors disabled:opacity-50"
          >
            <Heart
              className={`w-5 h-5 ${recipe?.marked ? 'fill-red-500 text-red-500' : ''}`} /* theme-intentional: heart/like affordance, not an error state */
            />
            {recipe?.marked ? 'Saved' : 'Save'}
          </button>
        )}
      </div>

      <RecipeDetail
        recipe={recipe}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <PrintButton />
            {isOwner && (
              <Link
                to="/recipes/$recipeId/edit"
                params={{ recipeId }}
                className="px-4 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Edit Recipe
              </Link>
            )}
          </div>
        }
      />

      <div className="mt-8 flex justify-center gap-4">
        <ExportButton recipe={recipe} />
        {isOwner && (
          <button
            onClick={() => setShowDelete(true)}
            className="print:hidden px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors" /* theme-intentional: danger/destructive action convention */
          >
            Delete Recipe
          </button>
        )}
      </div>

      <RelatedRecipesSection classificationId={recipe.classificationId} currentRecipeId={recipeId} />

      <DeleteConfirmModal
        open={showDelete}
        recipeName={recipe.name}
        onConfirm={() => deleteMutation.mutate({ id: recipeId })}
        onCancel={() => { setShowDelete(false); setDeleteError(undefined) }}
        isPending={deleteMutation.isPending}
        error={deleteError}
      />
    </PageLayout>
  )
}
