import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { trpc } from '@/lib/trpc'
import { buildPageMap, getDisplayOrderedRecipes } from '@/lib/cookbookPages'
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
import { PrintLayout } from '@/components/cookbooks/PrintLayout'
import RecipeDetail, { RecipeDetailProps } from '@/components/recipes/RecipeDetail'

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
      // Save original title and swap to cookbook name for print header
      const originalTitle = document.title
      document.title = printData.name
      window.print()
      // Restore original title immediately after print dialog
      document.title = originalTitle
    }
  }, [isLoading, printData, displayOnly])

  if (isLoading) return <CookbookPageLoading />
  if (!printData) return <CookbookPageNotFound />

  const { name, description, recipes, chapters, ownerName, collaborators } = printData
  const orderedRecipes = getDisplayOrderedRecipes(recipes, chapters ?? [])
  const pageMap = buildPageMap(orderedRecipes)

  return (
    <PrintLayout>
      <CookbookStandalonePage maxWidth="4xl">
        <CookbookPageChrome
          cookbookId={cookbookId}
          cookbookName={name}
          breadcrumbLabel="Print View"
        />
        <div className="cookbook-toc-page">
          <CookbookPageHeader name={name} description={description} subtitle="Table of Contents" />

          {recipes.length === 0 ? (
            <CookbookEmptyState />
          ) : (
            <CookbookTocList recipes={recipes} chapters={chapters ?? []} />
          )}

          <div
            className="cookbook-toc-footer mt-8 pt-4 border-t border-[color:var(--theme-print-border)] text-xs text-[var(--theme-print-fg-subtle)]"
            data-testid="cookbook-toc-footer"
          >
            <div>Created by: {ownerName || 'Unknown'}</div>
            {collaborators && collaborators.length > 0 && (
              <div className="mt-1" data-testid="cookbook-toc-collaborators">
                Collaborators: {collaborators.map((c) => c.name || 'Collaborator').join(', ')}
              </div>
            )}
          </div>
        </div>

        {orderedRecipes.map((recipe) => {
          const recipeForDetail: RecipeDetailProps['recipe'] = {
            ...recipe,
            imageUrl: null,
            marked: false, // print view hides interactive save controls; actual marked state is irrelevant here
          }

          const pageNumber = pageMap.get(recipe.id)

          return (
            <div key={recipe.id} className="cookbook-recipe-section">
              <RecipeDetail recipe={recipeForDetail} />
              {pageNumber !== undefined && (
                <div
                  className="cookbook-recipe-position-label mt-4 pt-2 border-t border-[color:var(--theme-print-border)] text-right text-xs text-[var(--theme-print-fg-subtle)] tabular-nums"
                  data-testid="cookbook-recipe-position-label"
                >
                  #{pageNumber}
                </div>
              )}
            </div>
          )
        })}

        {recipes.length > 0 && <CookbookAlphaIndex recipes={recipes} chapters={chapters ?? []} />}
      </CookbookStandalonePage>
    </PrintLayout>
  )
}
