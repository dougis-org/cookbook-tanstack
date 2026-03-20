import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { TaxonomyChips } from './TaxonomyChips'
import { ServingsRangeInput } from './ServingsRangeInput'
import { TAXONOMY_CONFIGS } from './filterConfigs'
import type { FilterConfig, AllFiltersKey } from '@/lib/filterConfig'

interface TaxonomyItem {
  id: string
  name: string
}

interface FilterMoreFiltersPanelProps {
  mealIds: string[] | undefined
  courseIds: string[] | undefined
  preparationIds: string[] | undefined
  minServings: number | undefined
  maxServings: number | undefined
  allMeals: TaxonomyItem[] | undefined
  allCourses: TaxonomyItem[] | undefined
  allPreparations: TaxonomyItem[] | undefined
  updateSearch: (updates: {
    mealIds?: string[] | undefined
    courseIds?: string[] | undefined
    preparationIds?: string[] | undefined
    minServings?: number | undefined
    maxServings?: number | undefined
  }) => void
  filterConfig?: FilterConfig
  counts?: {
    mealCounts?: Record<string, number>
    courseCounts?: Record<string, number>
    preparationCounts?: Record<string, number>
  }
}

export function FilterMoreFiltersPanel({
  mealIds,
  courseIds,
  preparationIds,
  minServings,
  maxServings,
  allMeals,
  allCourses,
  allPreparations,
  updateSearch,
  filterConfig,
  counts,
}: FilterMoreFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const filterValuesMap = {
    meals: { ids: mealIds, items: allMeals },
    courses: { ids: courseIds, items: allCourses },
    preparations: { ids: preparationIds, items: allPreparations },
  }

  const shouldShow = (filterKey: AllFiltersKey) =>
    !filterConfig || filterConfig.allFilters.includes(filterKey)

  const hasAnyFilters =
    TAXONOMY_CONFIGS.some((cfg) =>
      shouldShow(cfg.filterKey) && (filterValuesMap[cfg.key].ids?.length ?? 0) > 0
    ) ||
    (shouldShow('minServings') && minServings !== undefined) ||
    (shouldShow('maxServings') && maxServings !== undefined)

  const showMinServings = shouldShow('minServings')
  const showMaxServings = shouldShow('maxServings')
  const showServings = showMinServings || showMaxServings

  return (
    <div className="border-t border-slate-700 pt-3" data-testid="filter-more-filters-panel">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="more-filters-content"
        data-testid="filter-more-filters-toggle"
      >
        More Filters
        {hasAnyFilters && <span className="text-xs bg-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded">Active</span>}
        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div id="more-filters-content" className="mt-4 space-y-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700" data-testid="filter-more-filters-content">
          {TAXONOMY_CONFIGS.map((cfg) => {
            if (!shouldShow(cfg.filterKey)) return null
            const { ids, items } = filterValuesMap[cfg.key]
            return (
              <TaxonomyChips
                key={cfg.key}
                items={items}
                selectedIds={ids}
                label={cfg.label}
                onToggle={(id) => {
                  const current = ids ?? []
                  const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id]
                  updateSearch({ [cfg.filterKey]: next.length ? next : undefined })
                }}
                counts={counts?.[cfg.countKey]}
              />
            )
          })}

          {showServings && (
            <ServingsRangeInput
              minServings={minServings}
              maxServings={maxServings}
              showMin={showMinServings}
              showMax={showMaxServings}
              onMinChange={(v) => updateSearch({ minServings: v })}
              onMaxChange={(v) => updateSearch({ maxServings: v })}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default FilterMoreFiltersPanel
