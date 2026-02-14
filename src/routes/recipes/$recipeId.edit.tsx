import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { authMiddleware } from '@/lib/middleware'
import { trpc } from '@/lib/trpc'
import PageLayout from '@/components/layout/PageLayout'
import RecipeForm from '@/components/recipes/RecipeForm'

export const Route = createFileRoute('/recipes/$recipeId/edit')({
  component: EditRecipePage,
  server: {
    middleware: [authMiddleware],
  },
})

function EditRecipePage() {
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
          to="/recipes/$recipeId"
          params={{ recipeId }}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Recipe
        </Link>
      </div>

      <RecipeForm initialData={recipe} />
    </PageLayout>
  )
}
