import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import {
  CookbookPageLoading,
  CookbookPageNotFound,
  CookbookPageChrome,
  CookbookPageHeader,
  CookbookStandalonePage,
  RecipeTimeSpan,
} from '@/components/cookbooks/CookbookStandaloneLayout'
import RecipeDetail from '@/components/recipes/RecipeDetail'
import type { Recipe, TaxonomyItem } from '@/types/recipe'

export const Route = createFileRoute('/cookbooks/$cookbookId_/print')({
  component: CookbookPrintPage,
})

function CookbookPrintPage() {
  const { cookbookId } = Route.useParams()
  const { data: printData, isLoading } = useQuery(
    trpc.cookbooks.printById.queryOptions({ id: cookbookId }),
  )

  if (isLoading) return <CookbookPageLoading />
  if (!printData) return <CookbookPageNotFound />

  const { name, description, recipes } = printData

  return (
    <CookbookStandalonePage maxWidth="4xl">
      <div>
        <CookbookPageChrome
          cookbookId={cookbookId}
          cookbookName={name}
          breadcrumbLabel="Print View"
        />
        <CookbookPageHeader name={name} description={description} />

        {recipes.length === 0 ? (
          <p className="text-gray-400 text-center py-12 print:hidden">
            No recipes in this cookbook.
          </p>
        ) : (
          <ol className="space-y-2 mb-8">
            {recipes.map((recipe, index) => (
              <li key={recipe.id}>
                <div className="flex items-baseline gap-3 py-2 border-b border-slate-700/50 print:border-gray-200 print:text-black">
                  <span className="text-gray-500 print:text-gray-500 w-6 text-right flex-shrink-0 text-sm">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-white print:text-black">
                    {recipe.name}
                  </span>
                  <RecipeTimeSpan prepTime={recipe.prepTime} cookTime={recipe.cookTime} />
                </div>
              </li>
            ))}
          </ol>
        )}

        {/* Recipe sections — each starts on a new page when printed */}
        {recipes.map((recipe) => {
          const recipeForDetail: Recipe & {
            meals?: TaxonomyItem[]
            courses?: TaxonomyItem[]
            preparations?: TaxonomyItem[]
            classificationName?: string | null
            sourceName?: string | null
            sourceUrl?: string | null
          } = {
            ...recipe,
            imageUrl: null,
            difficulty: recipe.difficulty as Recipe['difficulty'],
          }

          return (
            <div key={recipe.id} className="cookbook-recipe-section">
              <RecipeDetail recipe={recipeForDetail} hideServingAdjuster />
            </div>
          )
        })}
      </div>
    </CookbookStandalonePage>
  )
}
