import { Recipe } from '@/types/recipe'

interface RecipeDetailProps {
  recipe: Partial<Recipe>
}

export default function RecipeDetail({ recipe }: RecipeDetailProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header Image */}
        <div className="h-96 bg-gray-200 dark:bg-gray-700">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image Available
            </div>
          )}
        </div>

        {/* Recipe Content */}
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {recipe.title || 'Recipe Title'}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {recipe.description || 'No description available'}
          </p>

          {/* Recipe Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Prep Time</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {recipe.prepTime ? `${recipe.prepTime} min` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cook Time</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {recipe.cookTime ? `${recipe.cookTime} min` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Servings</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {recipe.servings || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Difficulty</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {recipe.difficulty || 'N/A'}
              </p>
            </div>
          </div>

          {/* Ingredients Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ingredients
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="flex items-center text-gray-700 dark:text-gray-300"
                  >
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>
                    {ingredient.quantity} {ingredient.unit} {ingredient.name}
                  </li>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No ingredients listed
                </p>
              )}
            </ul>
          </section>

          {/* Instructions Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Instructions
            </h2>
            <ol className="space-y-4">
              {recipe.instructions && recipe.instructions.length > 0 ? (
                recipe.instructions.map((instruction, index) => (
                  <li
                    key={index}
                    className="flex gap-4 text-gray-700 dark:text-gray-300"
                  >
                    <span className="flex-shrink-0 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <p className="flex-1 pt-1">{instruction}</p>
                  </li>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No instructions provided
                </p>
              )}
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}
