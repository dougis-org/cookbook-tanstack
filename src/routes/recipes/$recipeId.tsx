import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import PageLayout from '@/components/layout/PageLayout'
import RecipeDetail from '@/components/recipes/RecipeDetail'

export const Route = createFileRoute('/recipes/$recipeId')({
  component: RecipeDetailPage,
})

function RecipeDetailPage() {
  const { recipeId } = Route.useParams()
  const { data: recipe, isLoading } = useQuery(
    trpc.recipes.byId.queryOptions({ id: recipeId }),
  )

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
      <div className="mb-6">
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Recipes
        </Link>
      </div>

      <RecipeDetail
        recipe={{
          ...recipe,
          title: recipe.name,
          description: recipe.notes ?? '',
          servings: recipe.servings ?? undefined,
        }}
      />

      <div className="mt-8 flex justify-center gap-4">
        <Link
          to="/recipes/$recipeId/edit"
          params={{ recipeId }}
          className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
        >
          Edit Recipe
        </Link>
        <button className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors">
          Delete Recipe
        </button>
      </div>
    </PageLayout>
  )
}
