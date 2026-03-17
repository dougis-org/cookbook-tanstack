import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { TaxonomyChips } from './TaxonomyChips'
import { ServingsRangeInput } from './ServingsRangeInput'
import { TAXONOMY_CONFIGS } from './filterConfigs'
import { type FilterConfig } from '@/lib/filterConfig'

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

// Map taxonomy items by key for easy lookup
const TAXONOMY_ITEMS_MAP = {
  meals: 'allMeals' as const,
  courses: 'allCourses' as const,
  preparations: 'allPreparations' as const,
}

/**
 * FilterMoreFiltersPanel - Collapsible advanced filters panel
 *
 * Displays an expandable/collapsible section containing:
 * - Meals, Courses, Preparations chips (rendered via TAXONOMY_CONFIGS)
 * - Min/Max servings range inputs
 *
 * The panel is controlled by local expand/collapse state (UI-only).
 * All filter values are managed via URL search parameters.
 */
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

  // Map filter values by key for easy access
  const filterValuesMap = {
    meals: { ids: mealIds, items: allMeals },
    courses: { ids: courseIds, items: allCourses },
    preparations: { ids: preparationIds, items: allPreparations },
  }

  // Map update keys to their filter value map keys
  const updateKeyToMapKey = {
    mealIds: 'meals' as const,
    courseIds: 'courses' as const,
    preparationIds: 'preparations' as const,
  }

  // Generic toggle handler factory for taxonomy items
  const createToggle = (updateKey: 'mealIds' | 'courseIds' | 'preparationIds') => {
    return (id: string) => {
      const mapKey = updateKeyToMapKey[updateKey]
      const currentIds = filterValuesMap[mapKey].ids
      const arr = currentIds ?? []
      const next = arr.includes(id) ? arr.filter((v) => v !== id) : [...arr, id]
      updateSearch({ [updateKey]: next.length ? next : undefined })
    }
  }

  // Check if filter config allows a given filter
  const shouldShow = (filterKey: string) => !filterConfig || filterConfig.allFilters.includes(filterKey as any)

  // Check if any filters are currently applied
  const hasAnyFilters =
    TAXONOMY_CONFIGS.some((cfg) => {
      const filterKey = cfg.filterKey
      return shouldShow(filterKey) && (filterValuesMap[cfg.key].ids?.length ?? 0) > 0
    }) ||
    (shouldShow('minServings') || shouldShow('maxServings')) &&
      (minServings || maxServings)

  const showServings = shouldShow('minServings') && shouldShow('maxServings')

  return (
    <div className="border-t border-slate-700 pt-3" data-testid="filter-more-filters-panel">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
        aria-expanded={isExpanded}
        data-testid="filter-more-filters-toggle"
      >
        More Filters
        {hasAnyFilters && <span className="text-xs bg-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded">Active</span>}
        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700" data-testid="filter-more-filters-content">
          {/* Render taxonomy chips via config iteration */}
          {TAXONOMY_CONFIGS.map((cfg) => {
            if (!shouldShow(cfg.filterKey)) return null
            const { ids, items } = filterValuesMap[cfg.key]
            return (
              <TaxonomyChips
                key={cfg.key}
                items={items}
                selectedIds={ids}
                label={cfg.label}
                onToggle={createToggle(cfg.filterKey)}
                counts={counts ? (counts as any)[cfg.countKey] : undefined}
              />
            )
          })}

          {showServings && (
            <ServingsRangeInput
              minServings={minServings}
              maxServings={maxServings}
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
