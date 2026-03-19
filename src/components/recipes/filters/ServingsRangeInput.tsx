interface ServingsRangeInputProps {
  minServings: number | undefined
  maxServings: number | undefined
  onMinChange: (value: number | undefined) => void
  onMaxChange: (value: number | undefined) => void
  showMin?: boolean
  showMax?: boolean
}

export function ServingsRangeInput({
  minServings,
  maxServings,
  onMinChange,
  onMaxChange,
  showMin = true,
  showMax = true,
}: ServingsRangeInputProps) {
  function parseServingValue(val: string): number | undefined {
    const n = Number(val)
    return val && Number.isInteger(n) && n > 0 ? n : undefined
  }

  if (!showMin && !showMax) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-300">Servings</h4>
      <div className="flex items-center gap-2">
        {showMin && (
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Min"
            value={minServings ?? ''}
            onChange={(e) => onMinChange(parseServingValue(e.target.value))}
            data-testid="filter-min-servings"
            className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-500"
          />
        )}
        {showMin && showMax && <span className="text-gray-600">–</span>}
        {showMax && (
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Max"
            value={maxServings ?? ''}
            onChange={(e) => onMaxChange(parseServingValue(e.target.value))}
            data-testid="filter-max-servings"
            className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-500"
          />
        )}
      </div>
    </div>
  )
}

export default ServingsRangeInput
