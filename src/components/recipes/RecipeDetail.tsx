import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { scaleQuantity } from '@/lib/servings'
import type { Recipe, TaxonomyItem } from '@/types/recipe'
import ClassificationBadge from '@/components/ui/ClassificationBadge'
import CardImage from '@/components/ui/CardImage'
import TaxonomyBadge from '@/components/ui/TaxonomyBadge'

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

/**
 * Split a text blob into lines for display.
 * - Leading and trailing blank lines are removed.
 * - Consecutive internal blank lines are collapsed to a single `''`.
 * - `''` entries in the returned array are blank-line sentinels; callers
 *   render them as visual spacers rather than content items.
 *
 * @internal exported for testing only
 */
export function splitLines(text: string | null): string[] {
  if (!text) return []
  const lines = text.split('\n')
  // Trim leading blank lines
  let start = 0
  while (start < lines.length && lines[start].trim().length === 0) start++
  // Trim trailing blank lines
  let end = lines.length - 1
  while (end >= start && lines[end].trim().length === 0) end--
  if (start > end) return []
  // Collapse consecutive internal blank lines
  const result: string[] = []
  let prevBlank = false
  for (let i = start; i <= end; i++) {
    const isBlank = lines[i].trim().length === 0
    if (isBlank) {
      if (!prevBlank) result.push('')
    } else {
      result.push(lines[i])
    }
    prevBlank = isBlank
  }
  return result
}

export default function RecipeDetail({ recipe, actions }: RecipeDetailProps) {
  const ingredientLines = useMemo(() => splitLines(recipe.ingredients), [recipe.ingredients])
  const [currentServings, setCurrentServings] = useState(recipe.servings ?? 1)
  const scaledIngredientLines = useMemo(() => {
    if (recipe.servings == null || currentServings === recipe.servings) return ingredientLines
    const factor = currentServings / recipe.servings
    return ingredientLines.map((line) => (line === '' ? line : scaleQuantity(line, factor)))
  }, [currentServings, ingredientLines, recipe.servings])
  const instructionLines = useMemo(() => splitLines(recipe.instructions), [recipe.instructions])
  const instructionSteps = useMemo(() => {
    let stepNumber = 0
    return instructionLines.map((line) => {
      if (line === '') return { isSpacer: true as const }
      stepNumber++
      return { isSpacer: false as const, content: line, number: stepNumber }
    })
  }, [instructionLines])
  const hasNutrition =
    recipe.calories != null ||
    recipe.fat != null ||
    recipe.cholesterol != null ||
    recipe.sodium != null ||
    recipe.protein != null

  useEffect(() => {
    setCurrentServings(recipe.servings ?? 1)
  }, [recipe.id, recipe.servings])

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
            <div className="flex flex-wrap gap-2 mb-4 print:hidden" data-testid="chiclet-wrapper">
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
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Servings</p>
              {recipe.servings == null ? (
                <p className="text-lg font-semibold text-gray-900 dark:text-white">N/A</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setCurrentServings((prev) => Math.max(1, prev - 1))}
                      disabled={currentServings <= 1}
                      aria-label="Decrease servings"
                      className="print:hidden h-7 w-7 rounded border border-slate-600 text-sm disabled:opacity-40"
                    >
                      -
                    </button>
                    <span aria-live="polite" className="min-w-6 text-center">{currentServings}</span>
                    <button
                      type="button"
                      onClick={() => setCurrentServings((prev) => prev + 1)}
                      aria-label="Increase servings"
                      className="print:hidden h-7 w-7 rounded border border-slate-600 text-sm"
                    >
                      +
                    </button>
                  </div>
                  {currentServings !== recipe.servings && (
                    <button
                      type="button"
                      onClick={() => setCurrentServings(recipe.servings ?? 1)}
                      className="print:hidden rounded border border-slate-600 px-2 py-1 text-xs font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>
            <RecipeMetaItem label="Difficulty" value={recipe.difficulty ?? 'N/A'} className="capitalize" />
          </div>

          {/* Ingredients Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ingredients
            </h2>
            {ingredientLines.length > 0 ? (
              <ul className="space-y-2">
                {scaledIngredientLines.map((line, i) => (
                  line === '' ? (
                    <li key={i} className="recipe-ingredient-spacer h-2" aria-hidden="true" role="presentation" />
                  ) : (
                    <li
                      key={i}
                      className="recipe-ingredient-item flex items-center text-gray-700 dark:text-gray-300"
                    >
                      <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 shrink-0"></span>
                      {line}
                    </li>
                  )
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
                {instructionSteps.map((step, index) =>
                  step.isSpacer ? (
                    <li key={index} className="recipe-instruction-spacer h-2" aria-hidden="true" role="presentation" />
                  ) : (
                    <li
                      key={index}
                      className="recipe-instruction-step flex gap-4 text-gray-700 dark:text-gray-300"
                    >
                      <span className="shrink-0 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-semibold">
                        {step.number}
                      </span>
                      <p className="flex-1 pt-1">{step.content}</p>
                    </li>
                  )
                )}
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
