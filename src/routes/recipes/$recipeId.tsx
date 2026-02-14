import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Heart } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useSession } from '@/lib/auth-client'
import PageLayout from '@/components/layout/PageLayout'
import RecipeDetail from '@/components/recipes/RecipeDetail'
import DeleteConfirmModal from '@/components/recipes/DeleteConfirmModal'

export const Route = createFileRoute('/recipes/$recipeId')({
  component: RecipeDetailPage,
})

function RecipeDetailPage() {
  const { recipeId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [showDelete, setShowDelete] = useState(false)

  const { data: recipe, isLoading } = useQuery(
    trpc.recipes.byId.queryOptions({ id: recipeId }),
  )

  const { data: markedData } = useQuery(
    trpc.recipes.isMarked.queryOptions({ id: recipeId }),
  )

  const toggleMarkedMutation = useMutation(
    trpc.recipes.toggleMarked.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['recipes', 'isMarked']] })
      },
    }),
  )

  const deleteMutation = useMutation(
    trpc.recipes.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [['recipes']] })
        navigate({ to: '/recipes' })
      },
    }),
  )

  const isOwner = session?.user?.id === recipe?.userId
  const isLoggedIn = !!session?.user

  if (isLoading) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-gray-400">Loading recipe...</p>
        </div>
      </PageLayout>
    )
  }

  if (!recipe) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Recipe not found</p>
          <Link
            to="/recipes"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Back to Recipes
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Recipes
        </Link>

        {isLoggedIn && (
          <button
            onClick={() => toggleMarkedMutation.mutate({ id: recipeId })}
            disabled={toggleMarkedMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-gray-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Heart
              className={`w-5 h-5 ${markedData?.marked ? 'fill-red-500 text-red-500' : ''}`}
            />
            {markedData?.marked ? 'Saved' : 'Save'}
          </button>
        )}
      </div>

      <RecipeDetail recipe={recipe} />

      {isOwner && (
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/recipes/$recipeId/edit"
            params={{ recipeId }}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
          >
            Edit Recipe
          </Link>
          <button
            onClick={() => setShowDelete(true)}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
          >
            Delete Recipe
          </button>
        </div>
      )}

      <DeleteConfirmModal
        open={showDelete}
        recipeName={recipe.name}
        onConfirm={() => deleteMutation.mutate({ id: recipeId })}
        onCancel={() => setShowDelete(false)}
        isPending={deleteMutation.isPending}
      />
    </PageLayout>
  )
}
