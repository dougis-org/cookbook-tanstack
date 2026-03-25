import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import {
  CookbookPageLoading,
  CookbookPageNotFound,
  CookbookPageChrome,
  CookbookPageHeader,
  CookbookStandalonePage,
  RecipeTimeSpan,
  CookbookEmptyState,
  RecipeIndexNumber,
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
  const chapters = (cookbook.chapters ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex)
  const hasChapters = chapters.length > 0

  return (
    <CookbookStandalonePage>
      <div>
        <CookbookPageChrome
          cookbookId={cookbookId}
          cookbookName={cookbook.name}
          breadcrumbLabel="Table of Contents"
        />
        <CookbookPageHeader name={cookbook.name} description={cookbook.description} />

        {recipes.length === 0 ? (
          <CookbookEmptyState />
        ) : hasChapters ? (
          // Chapter-grouped TOC with global numbering
          (() => {
            let globalIndex = 0
            return (
              <div className="space-y-6">
                {chapters.map((chapter) => {
                  const chapterRecipes = recipes
                    .filter((r) => r.chapterId === chapter.id)
                    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                  return (
                    <div key={chapter.id}>
                      <h2 className="text-lg font-semibold text-white print:text-black mb-2 border-b border-slate-600 print:border-gray-300 pb-1">
                        {chapter.name}
                      </h2>
                      <ol className="space-y-2">
                        {chapterRecipes.map((recipe) => {
                          const index = globalIndex++
                          return (
                            <li key={recipe.id}>
                              <Link
                                to="/recipes/$recipeId"
                                params={{ recipeId: recipe.id }}
                                className="flex items-baseline gap-3 group py-2 border-b border-slate-700/50 print:border-gray-200 print:text-black"
                              >
                                <RecipeIndexNumber index={index} />
                                <span className="flex-1 text-white print:text-black group-hover:text-cyan-400 transition-colors print:group-hover:text-black">
                                  {recipe.name}
                                </span>
                                <RecipeTimeSpan prepTime={recipe.prepTime} cookTime={recipe.cookTime} />
                              </Link>
                            </li>
                          )
                        })}
                      </ol>
                    </div>
                  )
                })}
              </div>
            )
          })()
        ) : (
          // Flat TOC (no chapters)
          <ol className="space-y-2">
            {recipes.map((recipe, index) => (
              <li key={recipe.id}>
                <Link
                  to="/recipes/$recipeId"
                  params={{ recipeId: recipe.id }}
                  className="flex items-baseline gap-3 group py-2 border-b border-slate-700/50 print:border-gray-200 print:text-black"
                >
                  <RecipeIndexNumber index={index} />
                  <span className="flex-1 text-white print:text-black group-hover:text-cyan-400 transition-colors print:group-hover:text-black">
                    {recipe.name}
                  </span>
                  <RecipeTimeSpan prepTime={recipe.prepTime} cookTime={recipe.cookTime} />
                </Link>
              </li>
            ))}
          </ol>
        )}

        <footer className="mt-12 text-center text-gray-500 print:text-gray-400 text-sm print:mt-16">
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
        </footer>
      </div>
    </CookbookStandalonePage>
  )
}
