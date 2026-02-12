import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import PageLayout from '@/components/layout/PageLayout'
import RecipeCard from '@/components/recipes/RecipeCard'

export const Route = createFileRoute('/categories/$categoryId')({
  component: CategoryDetailPage,
})

function CategoryDetailPage() {
  const { categoryId } = Route.useParams()

  const { data: classification, isLoading: loadingClassification } = useQuery(
    trpc.classifications.byId.queryOptions({ id: categoryId }),
  )

  const { data: recipes, isLoading: loadingRecipes } = useQuery(
    trpc.recipes.list.queryOptions({ classificationId: categoryId }),
  )

  const isLoading = loadingClassification || loadingRecipes

  if (isLoading) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-gray-400">Loading category...</p>
        </div>
      </PageLayout>
    )
  }

  if (!classification) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Category not found</p>
          <Link
            to="/categories"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Back to Categories
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="mb-6">
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Categories
        </Link>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">{classification.name}</h1>
        <p className="text-gray-400 text-lg mb-2">{classification.description}</p>
        <p className="text-gray-500">{recipes?.length ?? 0} recipes</p>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">Recipes in this category</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes?.map((recipe) => (
          <Link key={recipe.id} to="/recipes/$recipeId" params={{ recipeId: recipe.id }}>
            <RecipeCard recipe={{ ...recipe, title: recipe.name }} />
          </Link>
        ))}
      </div>
    </PageLayout>
  )
}
