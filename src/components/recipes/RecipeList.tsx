import { Recipe } from '@/types/recipe'

interface RecipeListProps {
  recipes: Partial<Recipe>[]
}

export default function RecipeList({ recipes }: RecipeListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.length === 0 ? (
        <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
          No recipes found
        </div>
      ) : (
        recipes.map((recipe) => (
          <div key={recipe.id} className="recipe-card-placeholder">
            {/* Recipe cards will be rendered here */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {recipe.title || 'Recipe'}
              </h3>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
