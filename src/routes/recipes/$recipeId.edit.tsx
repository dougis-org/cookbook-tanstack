import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import RecipeForm from '@/components/recipes/RecipeForm'

export const Route = createFileRoute('/recipes/$recipeId/edit')({
  component: EditRecipePage,
})

function EditRecipePage() {
  const { recipeId } = Route.useParams()

  // Placeholder data - will be replaced with actual data fetching
  const recipe = {
    id: recipeId,
    title: 'Classic Spaghetti Carbonara',
    description:
      'A traditional Italian pasta dish with eggs, cheese, and pancetta',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: 'medium' as const,
  }

  return (
    <PageLayout>
      <div className="mb-6">
        <Link
          to="/recipes/$recipeId"
          params={{ recipeId }}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Recipe
        </Link>
      </div>

      <RecipeForm initialData={recipe} />
    </PageLayout>
  )
}
