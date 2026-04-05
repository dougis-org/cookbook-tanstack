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
  const chapters = cookbook.chapters ?? []

  return (
    <CookbookStandalonePage>
      <CookbookPageChrome
        cookbookId={cookbookId}
        cookbookName={cookbook.name}
        breadcrumbLabel="Table of Contents"
      />
      <CookbookPageHeader name={cookbook.name} description={cookbook.description} subtitle="Table of Contents" />

      {recipes.length === 0 ? (
        <CookbookEmptyState />
      ) : (
        <CookbookTocList recipes={recipes} chapters={chapters} />
      )}

      <footer className="mt-12 text-center text-gray-500 print:text-gray-400 text-sm print:mt-16">
        {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
      </footer>
    </CookbookStandalonePage>
  )
}
