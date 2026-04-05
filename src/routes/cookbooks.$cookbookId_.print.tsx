import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc'
import {
  CookbookPageLoading,
  CookbookPageNotFound,
  CookbookPageChrome,
  CookbookPageHeader,
  CookbookStandalonePage,
  CookbookTocList,
  CookbookEmptyState,
  CookbookAlphaIndex,
} from '@/components/cookbooks/CookbookStandaloneLayout'
import RecipeDetail from '@/components/recipes/RecipeDetail'
import type { Recipe, TaxonomyItem } from '@/types/recipe'

export const Route = createFileRoute('/cookbooks/$cookbookId_/print')({
  component: CookbookPrintPage,
  validateSearch: (search: Record<string, unknown>) => {
    const displayonly = search.displayonly

    return {
      displayonly:
        typeof displayonly === 'string' || typeof displayonly === 'number'
          ? displayonly
          : undefined,
    }
  },
})

export function CookbookPrintPage() {
  const { cookbookId } = Route.useParams()
  const { displayonly } = Route.useSearch()
  const displayOnly = String(displayonly) === '1'
  const hasPrinted = useRef(false)
  const { data: printData, isLoading } = useQuery(
    trpc.cookbooks.printById.queryOptions({ id: cookbookId }),
  )

  useEffect(() => {
    if (!isLoading && printData && !displayOnly && !hasPrinted.current) {
      hasPrinted.current = true
      window.print()
    }
  }, [isLoading, printData, displayOnly])

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
      <CookbookPageHeader name={name} description={description} subtitle="Table of Contents" />

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
          marked: false, // print view hides interactive save controls; actual marked state is irrelevant here
        }

        return (
          <div key={recipe.id} className="cookbook-recipe-section">
            <RecipeDetail recipe={recipeForDetail} hideServingAdjuster />
          </div>
        )
      })}

      {recipes.length > 0 && <CookbookAlphaIndex recipes={recipes} />}
    </CookbookStandalonePage>
  )
}
