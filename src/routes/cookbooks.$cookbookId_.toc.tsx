import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import {
  CookbookPageLoading,
  CookbookPageNotFound,
  CookbookPageChrome,
  CookbookPageHeader,
} from '@/components/cookbooks/CookbookStandaloneLayout'

export const Route = createFileRoute('/cookbooks/$cookbookId_/toc')({
  component: CookbookTocPage,
})

function CookbookTocPage() {
  const { cookbookId } = Route.useParams()
  const { data: cookbook, isLoading } = useQuery(
    trpc.cookbooks.byId.queryOptions({ id: cookbookId }),
  )

  if (isLoading) return <CookbookPageLoading />
  if (!cookbook) return <CookbookPageNotFound />

  const recipes = cookbook.recipes ?? []

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 print:bg-white print:text-black">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <CookbookPageChrome
          cookbookId={cookbookId}
          cookbookName={cookbook.name}
          breadcrumbLabel="Table of Contents"
        />
        <CookbookPageHeader name={cookbook.name} description={cookbook.description} />

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
