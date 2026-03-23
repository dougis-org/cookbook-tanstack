import type { Recipe } from '@/types/recipe'
import ClassificationBadge from '@/components/ui/ClassificationBadge'
import CardImage from '@/components/ui/CardImage'

interface RecipeCardProps {
  recipe: Pick<Recipe, 'id' | 'name' | 'imageUrl' | 'prepTime' | 'cookTime' | 'difficulty' | 'notes' | 'classificationId'> & {
    classificationName?: string | null
  }
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <div data-testid="recipe-card" className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      <CardImage src={recipe.imageUrl} alt={recipe.name} className="h-48 bg-gray-200 dark:bg-gray-700" data-testid="recipe-card-image" />
      <div className="p-4">
        {recipe.classificationId && recipe.classificationName && (
          <div className="mb-2">
            <ClassificationBadge
              classificationId={recipe.classificationId}
              classificationName={recipe.classificationName}
            />
          </div>
        )}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {recipe.name}
        </h3>
        {recipe.notes && (
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
            {recipe.notes}
          </p>
        )}
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
