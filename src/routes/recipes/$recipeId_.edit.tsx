import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { requireAuth } from '@/lib/auth-guard'
import { trpc } from '@/lib/trpc'
import PageLayout from '@/components/layout/PageLayout'
import RecipeForm from '@/components/recipes/RecipeForm'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const Route = createFileRoute('/recipes/$recipeId_/edit')({
  component: EditRecipePage,
  beforeLoad: requireAuth(),
})

function EditRecipePage() {
  const { recipeId } = Route.useParams()
  const { data: recipe, isLoading } = useQuery(
    trpc.recipes.byId.queryOptions({ id: recipeId }),
  )

  if (isLoading) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-[var(--theme-fg-subtle)]">Loading recipe...</p>
        </div>
      </PageLayout>
    )
  }

  if (!recipe) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-[var(--theme-fg-subtle)] mb-4">Recipe not found</p>
          <Link
            to="/recipes"
            className="text-[var(--theme-accent)] hover:text-[var(--theme-accent-hover)] transition-colors"
          >
            Back to Recipes
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Breadcrumb items={[
        { label: 'Recipes', to: '/recipes' },
        { label: recipe.name, to: '/recipes/$recipeId', params: { recipeId } },
        { label: 'Edit' },
      ]} />
      <RecipeForm initialData={recipe} />
    </PageLayout>
  )
}
