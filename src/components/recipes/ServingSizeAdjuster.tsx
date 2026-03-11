import { useEffect, useState } from 'react'
import { scaleQuantity } from '@/lib/servings'

interface ServingSizeAdjusterProps {
  originalServings: number
  ingredients: string[]
  onScaledIngredientsChange: (ingredients: string[]) => void
}

export default function ServingSizeAdjuster({
  originalServings,
  ingredients,
  onScaledIngredientsChange,
}: ServingSizeAdjusterProps) {
  const [currentServings, setCurrentServings] = useState(originalServings)

  useEffect(() => {
    setCurrentServings(originalServings)
  }, [originalServings])

  useEffect(() => {
    const factor = currentServings / originalServings
    onScaledIngredientsChange(ingredients.map((line) => scaleQuantity(line, factor)))
  }, [currentServings, ingredients, onScaledIngredientsChange, originalServings])

  return (
    <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <span className="font-medium">Servings:</span>
        <button
          type="button"
          onClick={() => setCurrentServings((prev) => Math.max(1, prev - 1))}
          disabled={currentServings <= 1}
          aria-label="Decrease servings"
          className="h-7 w-7 rounded border border-slate-600 disabled:opacity-40"
        >
          -
        </button>
        <span aria-live="polite" className="min-w-6 text-center font-semibold">{currentServings}</span>
        <button
          type="button"
          onClick={() => setCurrentServings((prev) => prev + 1)}
          aria-label="Increase servings"
          className="h-7 w-7 rounded border border-slate-600"
        >
          +
        </button>

        {currentServings !== originalServings && (
          <button
            type="button"
            onClick={() => setCurrentServings(originalServings)}
            className="ml-2 px-2 py-1 text-xs rounded border border-slate-600 hover:bg-slate-800"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
