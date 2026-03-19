interface TaxonomyItem {
  id: string
  name: string
}

interface TaxonomyChipsProps {
  items: TaxonomyItem[] | undefined
  selectedIds: string[] | undefined
  label: string
  onToggle: (id: string) => void
  counts?: Record<string, number>
}

export function TaxonomyChips({
  items,
  selectedIds,
  label,
  onToggle,
  counts,
}: TaxonomyChipsProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-300">{label}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selectedIds?.includes(item.id)
          const count = counts?.[item.id]
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onToggle(item.id)}
              data-testid={`taxonomy-chip-${label.toLowerCase()}-${item.id}`}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'
              }`}
            >
              {item.name}
              {count !== undefined && (
                <span className="ml-1 text-xs opacity-75">({count})</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TaxonomyChips
