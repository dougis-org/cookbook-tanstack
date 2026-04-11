import type { RecipeFilters } from '@/types/recipe'

interface SearchFilterProps {
  filters: RecipeFilters
  onFiltersChange: (filters: RecipeFilters) => void
}

const inputClass =
  'w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]'

const labelClass = 'block text-sm font-medium text-[var(--theme-fg-muted)] mb-2'

export default function SearchFilter({ filters, onFiltersChange }: SearchFilterProps) {
  return (
    <div className="bg-[var(--theme-surface)] rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-[var(--theme-fg)] mb-4">
        Search & Filter
      </h2>

      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <label className={labelClass}>
            Search Recipes
          </label>
          <input
            type="text"
            placeholder="Search by name or ingredients..."
            className={inputClass}
            value={filters.search ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className={labelClass}>
            Difficulty
          </label>
          <select
            className={inputClass}
            value={filters.difficulty ?? ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                difficulty: (e.target.value || undefined) as RecipeFilters['difficulty'],
              })
            }
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Time Filters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Max Prep Time
            </label>
            <input
              type="number"
              placeholder="Minutes"
              className={inputClass}
              value={filters.maxPrepTime ?? ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, maxPrepTime: Number(e.target.value) || undefined })
              }
            />
          </div>
          <div>
            <label className={labelClass}>
              Max Cook Time
            </label>
            <input
              type="number"
              placeholder="Minutes"
              className={inputClass}
              value={filters.maxCookTime ?? ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, maxCookTime: Number(e.target.value) || undefined })
              }
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <button
          className="w-full px-4 py-2 bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] font-semibold rounded-lg transition-colors"
          onClick={() => onFiltersChange({})}
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}
