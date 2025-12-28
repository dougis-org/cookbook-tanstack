import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import RecipeCard from '@/components/recipes/RecipeCard'

export const Route = createFileRoute('/categories/$categoryId')({
  component: CategoryDetailPage,
})

function CategoryDetailPage() {
  const { categoryId } = Route.useParams()

  // Placeholder data - will be replaced with actual data fetching
  const category = {
    id: categoryId,
    name: 'Main Courses',
    description: 'Hearty and satisfying main dishes for any occasion',
    recipeCount: 32,
  }

  const recipes = [
    {
      id: '1',
      title: 'Classic Spaghetti Carbonara',
      description: 'A traditional Italian pasta dish',
      prepTime: 15,
      cookTime: 20,
      difficulty: 'medium' as const,
    },
    {
      id: '2',
      title: 'Grilled Salmon with Herbs',
      description: 'Fresh salmon with herb marinade',
      prepTime: 10,
      cookTime: 15,
      difficulty: 'medium' as const,
    },
    {
      id: '3',
      title: 'Beef Stir Fry',
      description: 'Quick and flavorful Asian-inspired dish',
      prepTime: 20,
      cookTime: 10,
      difficulty: 'easy' as const,
    },
  ]

  return (
    <PageLayout>
      <div className="mb-6">
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Categories
        </Link>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">{category.name}</h1>
        <p className="text-gray-400 text-lg mb-2">{category.description}</p>
        <p className="text-gray-500">{category.recipeCount} recipes</p>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">Recipes in this category</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <Link key={recipe.id} to="/recipes/$recipeId" params={{ recipeId: recipe.id }}>
            <RecipeCard recipe={recipe} />
          </Link>
        ))}
      </div>
    </PageLayout>
  )
}
