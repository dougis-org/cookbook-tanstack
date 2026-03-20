import { useEffect, useMemo, useState } from 'react'
import type { Recipe, TaxonomyItem } from '@/types/recipe'
import TaxonomyBadge from '@/components/ui/TaxonomyBadge'
import RecipeMetadataHeader from '@/components/recipes/RecipeMetadataHeader'
import ServingSizeAdjuster from '@/components/recipes/ServingSizeAdjuster'

interface RecipeDetailProps {
  recipe: Recipe & {
    meals?: TaxonomyItem[]
    courses?: TaxonomyItem[]
    preparations?: TaxonomyItem[]
    classificationName?: string | null
    sourceName?: string | null
    sourceUrl?: string | null
  }
}

/** Split a text blob into non-empty lines for display. */
function splitLines(text: string | null): string[] {
  if (!text) return []
  return text.split('\n').filter((line) => line.trim().length > 0)
}

export default function RecipeDetail({ recipe }: RecipeDetailProps) {
  const ingredientLines = useMemo(() => splitLines(recipe.ingredients), [recipe.ingredients])
  const [scaledIngredientLines, setScaledIngredientLines] = useState(ingredientLines)
  const instructionLines = useMemo(() => splitLines(recipe.instructions), [recipe.instructions])
  const hasNutrition =
    recipe.calories != null ||
    recipe.fat != null ||
    recipe.cholesterol != null ||
    recipe.sodium != null ||
    recipe.protein != null

  useEffect(() => {
    setScaledIngredientLines(ingredientLines)
  }, [recipe.id, recipe.ingredients])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header Image */}
        {recipe.imageUrl && (
          <div data-testid="recipe-detail-image" className="h-96 bg-gray-200 dark:bg-gray-700">
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Recipe Content */}
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {recipe.name}
          </h1>

          {/* Recipe Metadata Header (Category + Source) */}
          {(recipe.classificationName || recipe.sourceName) && (
            <RecipeMetadataHeader
              classification={
                recipe.classificationId && recipe.classificationName
                  ? { id: recipe.classificationId, name: recipe.classificationName }
                  : undefined
              }
              source={
                recipe.sourceName
                  ? { name: recipe.sourceName, url: recipe.sourceUrl || undefined }
                  : undefined
              }
            />
          )}

          {/* Grouped Taxonomy Badges with Labels */}
          {(recipe.meals?.length || recipe.courses?.length || recipe.preparations?.length) && (
            <div className="mb-6">
              {recipe.meals?.length ? (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Meals:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recipe.meals.map((m) => (
                      <span key={m.id} data-testid="taxonomy-badge">
                        <TaxonomyBadge name={m.name} variant="meal" />
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {recipe.courses?.length ? (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Courses:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recipe.courses.map((c) => (
                      <span key={c.id} data-testid="taxonomy-badge">
                        <TaxonomyBadge name={c.name} variant="course" />
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {recipe.preparations?.length ? (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Preparations:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recipe.preparations.map((p) => (
                      <span key={p.id} data-testid="taxonomy-badge">
                        <TaxonomyBadge name={p.name} variant="preparation" />
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

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
            {recipe.servings && ingredientLines.length > 0 && (
              <ServingSizeAdjuster
                originalServings={recipe.servings}
                ingredients={ingredientLines}
                onScaledIngredientsChange={setScaledIngredientLines}
              />
            )}
            {ingredientLines.length > 0 ? (
              <ul className="space-y-2">
                {(recipe.servings ? scaledIngredientLines : ingredientLines).map((line, i) => (
                  <li
                    key={i}
                    className="recipe-ingredient-item flex items-center text-gray-700 dark:text-gray-300"
                  >
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 shrink-0"></span>
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
                    className="recipe-instruction-step flex gap-4 text-gray-700 dark:text-gray-300"
                  >
                    <span className="shrink-0 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-semibold">
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
