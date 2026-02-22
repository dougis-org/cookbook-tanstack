import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import PageLayout from '@/components/layout/PageLayout'
import RecipeCard from '@/components/recipes/RecipeCard'

export const Route = createFileRoute('/sources/$sourceId')({
  component: SourceDetailPage,
})

function SourceDetailPage() {
  const { sourceId } = Route.useParams()

  const { data: source, isLoading: loadingSource } = useQuery(
    trpc.sources.byId.queryOptions({ id: sourceId }),
  )

  const { data: recipes, isLoading: loadingRecipes } = useQuery(
    trpc.recipes.list.queryOptions({ sourceId }),
  )

  const isLoading = loadingSource || loadingRecipes

  if (isLoading) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-gray-400">Loading source...</p>
        </div>
      </PageLayout>
    )
  }

  if (!source) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Source not found</p>
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

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">{source.name}</h1>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {source.url}
          </a>
        )}
        <p className="text-gray-500 mt-2">{recipes?.total ?? 0} recipes</p>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">Recipes from this source</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes?.items.map((recipe) => (
          <Link key={recipe.id} to="/recipes/$recipeId" params={{ recipeId: recipe.id }}>
            <RecipeCard recipe={recipe} />
          </Link>
        ))}
      </div>

      {!recipes?.items.length && (
        <div className="text-center py-12">
          <p className="text-gray-400">No recipes from this source yet</p>
        </div>
      )}
    </PageLayout>
  )
}
