import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import { Printer, ArrowLeft } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const Route = createFileRoute('/cookbooks/$cookbookId/toc')({
  component: CookbookTocPage,
})

function CookbookTocPage() {
  const { cookbookId } = Route.useParams()
  const { data: cookbook, isLoading } = useQuery(
    trpc.cookbooks.byId.queryOptions({ id: cookbookId }),
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    )
  }

  if (!cookbook) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Cookbook not found.</p>
        <Link to="/cookbooks" className="text-cyan-400 hover:text-cyan-300">
          Back to Cookbooks
        </Link>
      </div>
    )
  }

  const recipes = cookbook.recipes ?? []

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 print:bg-white print:text-black">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Screen-only nav */}
        <div className="print:hidden mb-2">
          <Breadcrumb items={[
            { label: 'Cookbooks', to: '/cookbooks' },
            { label: cookbook.name, to: '/cookbooks/$cookbookId', params: { cookbookId } },
            { label: 'Table of Contents' },
          ]} />
        </div>
        <div className="flex justify-between items-center mb-8 print:hidden">
          <Link
            to="/cookbooks/$cookbookId"
            params={{ cookbookId }}
            className="flex items-center gap-1.5 text-gray-400 hover:text-cyan-400 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cookbook
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* TOC content */}
        <header className="mb-8 text-center border-b border-slate-700 print:border-gray-300 pb-6">
          <h1 className="text-4xl font-bold text-white print:text-black mb-2">{cookbook.name}</h1>
          {cookbook.description && (
            <p className="text-gray-300 print:text-gray-700">{cookbook.description}</p>
          )}
          <p className="text-gray-400 print:text-gray-600 text-sm mt-2">
            Table of Contents
          </p>
        </header>

        {recipes.length === 0 ? (
          <p className="text-gray-400 text-center py-12 print:hidden">No recipes in this cookbook.</p>
        ) : (
          <ol className="space-y-2">
            {recipes.map((recipe, index) => (
              <li key={recipe.id}>
                <Link
                  to="/recipes/$recipeId"
                  params={{ recipeId: recipe.id }}
                  className="flex items-baseline gap-3 group py-2 border-b border-slate-700/50 print:border-gray-200 print:text-black"
                >
                  <span className="text-gray-500 print:text-gray-500 w-6 text-right flex-shrink-0 text-sm">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-white print:text-black group-hover:text-cyan-400 transition-colors print:group-hover:text-black">
                    {recipe.name}
                  </span>
                  <span className="text-gray-500 print:text-gray-400 text-xs">
                    {[
                      recipe.prepTime && `${recipe.prepTime}m prep`,
                      recipe.cookTime && `${recipe.cookTime}m cook`,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        <footer className="mt-12 text-center text-gray-500 print:text-gray-400 text-sm print:mt-16">
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
        </footer>
      </div>
    </div>
  )
}
