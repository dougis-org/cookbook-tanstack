import type { Recipe } from '@/types/recipe'

interface RecipeDetailProps {
  recipe: Recipe
}

/** Split a text blob into non-empty lines for display. */
function splitLines(text: string | null): string[] {
  if (!text) return []
  return text.split('\n').filter((line) => line.trim().length > 0)
}

export default function RecipeDetail({ recipe }: RecipeDetailProps) {
  const ingredientLines = splitLines(recipe.ingredients)
  const instructionLines = splitLines(recipe.instructions)
  const hasNutrition =
    recipe.calories != null ||
    recipe.fat != null ||
    recipe.cholesterol != null ||
    recipe.sodium != null ||
    recipe.protein != null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header Image */}
        <div className="h-96 bg-gray-200 dark:bg-gray-700">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
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
            {recipe.name}
          </h1>

          {recipe.notes && (
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {recipe.notes}
            </p>
          )}

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
                {recipe.servings ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Difficulty</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {recipe.difficulty ?? 'N/A'}
              </p>
            </div>
          </div>

          {/* Ingredients Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ingredients
            </h2>
            {ingredientLines.length > 0 ? (
              <ul className="space-y-2">
                {ingredientLines.map((line, i) => (
                  <li
                    key={i}
                    className="flex items-center text-gray-700 dark:text-gray-300"
                  >
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No ingredients listed
              </p>
            )}
          </section>

          {/* Instructions Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Instructions
            </h2>
            {instructionLines.length > 0 ? (
              <ol className="space-y-4">
                {instructionLines.map((step, index) => (
                  <li
                    key={index}
                    className="flex gap-4 text-gray-700 dark:text-gray-300"
                  >
                    <span className="flex-shrink-0 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <p className="flex-1 pt-1">{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No instructions provided
              </p>
            )}
          </section>

          {/* Nutrition Panel */}
          {hasNutrition && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Nutrition
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {recipe.calories != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">{recipe.calories}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Calories</p>
                  </div>
                )}
                {recipe.fat != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">{recipe.fat}g</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fat</p>
                  </div>
                )}
                {recipe.cholesterol != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">{recipe.cholesterol}mg</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cholesterol</p>
                  </div>
                )}
                {recipe.sodium != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">{recipe.sodium}mg</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sodium</p>
                  </div>
                )}
                {recipe.protein != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-400">{recipe.protein}g</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Protein</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
