import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Recipe, TaxonomyItem } from '@/types/recipe'
import ClassificationBadge from '@/components/ui/ClassificationBadge'
import CardImage from '@/components/ui/CardImage'
import TaxonomyBadge from '@/components/ui/TaxonomyBadge'
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
  actions?: ReactNode
  hideServingAdjuster?: boolean
}

function RecipeMetaItem({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>{value}</p>
    </div>
  )
}

function NutritionItem({ value, unit = '', label }: { value: number; unit?: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-cyan-400">{value}{unit}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  )
}

function TaxonomyBadges({
  items,
  variant,
}: {
  items?: TaxonomyItem[]
  variant: 'meal' | 'course' | 'preparation'
}) {
  return <>{items?.map((item) => <TaxonomyBadge key={item.id} name={item.name} variant={variant} />)}</>
}

/** Split a text blob into non-empty lines for display. */
function splitLines(text: string | null): string[] {
  if (!text) return []
  return text.split('\n').filter((line) => line.trim().length > 0)
}

export default function RecipeDetail({ recipe, actions, hideServingAdjuster }: RecipeDetailProps) {
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
        <CardImage src={recipe.imageUrl} alt={recipe.name} className="h-96 bg-gray-200 dark:bg-gray-700" data-testid="recipe-detail-image" />

        {/* Recipe Content */}
        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {recipe.name}
            </h1>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>

          {/* Classification + taxonomy tags */}
          {((recipe.classificationId && recipe.classificationName) || recipe.meals?.length || recipe.courses?.length || recipe.preparations?.length) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {recipe.classificationId && recipe.classificationName && (
                <ClassificationBadge
                  classificationId={recipe.classificationId}
                  classificationName={recipe.classificationName}
                  linkable
                />
              )}
              <TaxonomyBadges items={recipe.meals} variant="meal" />
              <TaxonomyBadges items={recipe.courses} variant="course" />
              <TaxonomyBadges items={recipe.preparations} variant="preparation" />
            </div>
          )}

          {/* Source */}
          {recipe.sourceName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Source:{' '}
              {recipe.sourceUrl ? (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors underline"
                >
                  {recipe.sourceName}
                </a>
              ) : (
                <span className="text-gray-300">{recipe.sourceName}</span>
              )}
            </p>
          )}

          {recipe.notes && (
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {recipe.notes}
            </p>
          )}

          {/* Recipe Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <RecipeMetaItem label="Prep Time" value={recipe.prepTime ? `${recipe.prepTime} min` : 'N/A'} />
            <RecipeMetaItem label="Cook Time" value={recipe.cookTime ? `${recipe.cookTime} min` : 'N/A'} />
            <RecipeMetaItem label="Servings" value={recipe.servings?.toString() ?? 'N/A'} />
            <RecipeMetaItem label="Difficulty" value={recipe.difficulty ?? 'N/A'} className="capitalize" />
          </div>

          {/* Ingredients Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ingredients
            </h2>
            {!hideServingAdjuster && recipe.servings && ingredientLines.length > 0 && (
              <ServingSizeAdjuster
                originalServings={recipe.servings}
                ingredients={ingredientLines}
                onScaledIngredientsChange={setScaledIngredientLines}
              />
            )}
            {ingredientLines.length > 0 ? (
              <ul className="space-y-2">
                {(recipe.servings && !hideServingAdjuster ? scaledIngredientLines : ingredientLines).map((line, i) => (
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
                {recipe.calories != null && <NutritionItem value={recipe.calories} label="Calories" />}
                {recipe.fat != null && <NutritionItem value={recipe.fat} unit="g" label="Fat" />}
                {recipe.cholesterol != null && <NutritionItem value={recipe.cholesterol} unit="mg" label="Cholesterol" />}
                {recipe.sodium != null && <NutritionItem value={recipe.sodium} unit="mg" label="Sodium" />}
                {recipe.protein != null && <NutritionItem value={recipe.protein} unit="g" label="Protein" />}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
