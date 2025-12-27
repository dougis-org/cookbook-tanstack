import { Recipe } from '@/types/recipe'

interface RecipeCardProps {
  recipe: Partial<Recipe>
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      <div className="h-48 bg-gray-200 dark:bg-gray-700">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {recipe.title || 'Untitled Recipe'}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
          {recipe.description || 'No description available'}
        </p>
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="flex gap-3">
            {recipe.prepTime && (
              <span>Prep: {recipe.prepTime} min</span>
            )}
            {recipe.cookTime && (
              <span>Cook: {recipe.cookTime} min</span>
            )}
          </div>
          {recipe.difficulty && (
            <span className="capitalize px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {recipe.difficulty}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
