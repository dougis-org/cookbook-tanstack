import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import RecipeCard from '@/components/recipes/RecipeCard'

export const Route = createFileRoute('/recipes/')({ component: RecipesPage })

function RecipesPage() {
  // Placeholder data - will be replaced with actual data fetching
  const recipes = [
    {
      id: '1',
      title: 'Classic Spaghetti Carbonara',
      description: 'A traditional Italian pasta dish with eggs, cheese, and pancetta',
      prepTime: 15,
      cookTime: 20,
      difficulty: 'medium' as const,
    },
    {
      id: '2',
      title: 'Chocolate Chip Cookies',
      description: 'Soft and chewy cookies loaded with chocolate chips',
      prepTime: 15,
      cookTime: 12,
      difficulty: 'easy' as const,
    },
    {
      id: '3',
      title: 'Grilled Salmon with Herbs',
      description: 'Fresh salmon fillet with a herb and lemon marinade',
      prepTime: 10,
      cookTime: 15,
      difficulty: 'medium' as const,
    },
  ]

  return (
    <PageLayout
      title="Recipes"
      description="Browse and discover delicious recipes"
    >
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search recipes..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>
        <Link
          to="/recipes/new"
          className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
        >
          <Plus className="w-5 h-5" />
          New Recipe
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 mb-4">No recipes found</p>
            <Link
              to="/recipes/new"
              className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create your first recipe
            </Link>
          </div>
        ) : (
          recipes.map((recipe) => (
            <Link key={recipe.id} to="/recipes/$recipeId" params={{ recipeId: recipe.id }}>
              <RecipeCard recipe={recipe} />
            </Link>
          ))
        )}
      </div>
    </PageLayout>
  )
}
