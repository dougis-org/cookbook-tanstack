import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import {
  CookbookPageLoading,
  CookbookPageNotFound,
  CookbookPageChrome,
  CookbookPageHeader,
  CookbookStandalonePage,
  CookbookTocList,
  CookbookEmptyState,
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

  const { name, description, recipes, chapters } = printData

  return (
    <CookbookStandalonePage maxWidth="4xl">
      <CookbookPageChrome
        cookbookId={cookbookId}
        cookbookName={name}
        breadcrumbLabel="Print View"
      />
      <CookbookPageHeader name={name} description={description} />

      {recipes.length === 0 ? (
        <CookbookEmptyState />
      ) : (
        <CookbookTocList recipes={recipes} chapters={chapters ?? []} />
      )}

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
        }

        return (
          <div key={recipe.id} className="cookbook-recipe-section">
            <RecipeDetail recipe={recipeForDetail} hideServingAdjuster />
          </div>
        )
      })}
    </CookbookStandalonePage>
  )
}
