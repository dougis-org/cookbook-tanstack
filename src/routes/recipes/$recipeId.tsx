import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import RecipeDetail from '@/components/recipes/RecipeDetail'

export const Route = createFileRoute('/recipes/$recipeId')({
  component: RecipeDetailPage,
})

function RecipeDetailPage() {
  const { recipeId } = Route.useParams()

  // Placeholder data - will be replaced with actual data fetching
  const recipe = {
    id: recipeId,
    title: 'Classic Spaghetti Carbonara',
    description:
      'A traditional Italian pasta dish with eggs, cheese, and pancetta. This authentic recipe creates a creamy sauce without cream!',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: 'medium' as const,
    categoryId: '1',
    tags: ['Italian', 'Pasta', 'Quick'],
    ingredients: [
      { id: '1', name: 'Spaghetti', quantity: 400, unit: 'g' },
      { id: '2', name: 'Pancetta', quantity: 200, unit: 'g' },
      { id: '3', name: 'Eggs', quantity: 4, unit: 'large' },
      { id: '4', name: 'Parmesan cheese', quantity: 100, unit: 'g' },
      { id: '5', name: 'Black pepper', quantity: 1, unit: 'tsp' },
    ],
    instructions: [
      'Bring a large pot of salted water to boil and cook the spaghetti according to package directions.',
      'While the pasta cooks, cut the pancetta into small cubes and fry in a large pan over medium heat until crispy.',
      'In a bowl, whisk together the eggs and grated Parmesan cheese. Season generously with black pepper.',
      'When the pasta is ready, reserve 1 cup of pasta water and drain the rest.',
      'Remove the pan from heat and add the hot pasta to the pancetta.',
      'Quickly pour in the egg mixture while tossing the pasta constantly. Add reserved pasta water as needed to create a creamy sauce.',
      'Serve immediately with extra Parmesan and black pepper.',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return (
    <PageLayout>
      <div className="mb-6">
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Recipes
        </Link>
      </div>

      <RecipeDetail recipe={recipe} />

      <div className="mt-8 flex justify-center gap-4">
        <Link
          to="/recipes/$recipeId/edit"
          params={{ recipeId }}
          className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
        >
          Edit Recipe
        </Link>
        <button className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors">
          Delete Recipe
        </button>
      </div>
    </PageLayout>
  )
}
