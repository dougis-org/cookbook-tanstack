import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { TaxonomyChips } from './TaxonomyChips'
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

/**
 * FilterMoreFiltersPanel - Collapsible advanced filters panel
 *
 * Displays an expandable/collapsible section containing:
 * - Meals chips
 * - Courses chips
 * - Preparations chips
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

  const toggleMeal = (id: string) => {
    const arr = mealIds ?? []
    const next = arr.includes(id) ? arr.filter((v) => v !== id) : [...arr, id]
    updateSearch({ mealIds: next.length ? next : undefined })
  }

  const toggleCourse = (id: string) => {
    const arr = courseIds ?? []
    const next = arr.includes(id) ? arr.filter((v) => v !== id) : [...arr, id]
    updateSearch({ courseIds: next.length ? next : undefined })
  }

  const togglePreparation = (id: string) => {
    const arr = preparationIds ?? []
    const next = arr.includes(id) ? arr.filter((v) => v !== id) : [...arr, id]
    updateSearch({ preparationIds: next.length ? next : undefined })
  }

  const showMeals = !filterConfig || filterConfig.allFilters.includes('mealIds')
  const showCourses = !filterConfig || filterConfig.allFilters.includes('courseIds')
  const showPreparations = !filterConfig || filterConfig.allFilters.includes('preparationIds')
  const showServings =
    (!filterConfig || filterConfig.allFilters.includes('minServings')) &&
    (!filterConfig || filterConfig.allFilters.includes('maxServings'))

  const hasAnyFilters =
    (showMeals && (mealIds?.length ?? 0) > 0) ||
    (showCourses && (courseIds?.length ?? 0) > 0) ||
    (showPreparations && (preparationIds?.length ?? 0) > 0) ||
    (showServings && (minServings || maxServings))

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
          {showMeals && (
            <TaxonomyChips
              items={allMeals}
              selectedIds={mealIds}
              label="Meals"
              onToggle={toggleMeal}
              counts={counts?.mealCounts}
            />
          )}

          {showCourses && (
            <TaxonomyChips
              items={allCourses}
              selectedIds={courseIds}
              label="Courses"
              onToggle={toggleCourse}
              counts={counts?.courseCounts}
            />
          )}

          {showPreparations && (
            <TaxonomyChips
              items={allPreparations}
              selectedIds={preparationIds}
              label="Preparations"
              onToggle={togglePreparation}
              counts={counts?.preparationCounts}
            />
          )}

          {showServings && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Servings</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Min"
                  value={minServings ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    const n = Number(v)
                    updateSearch({ minServings: v && Number.isInteger(n) && n > 0 ? n : undefined })
                  }}
                  data-testid="filter-min-servings"
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-500"
                />
                <span className="text-gray-600">–</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Max"
                  value={maxServings ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    const n = Number(v)
                    updateSearch({ maxServings: v && Number.isInteger(n) && n > 0 ? n : undefined })
                  }}
                  data-testid="filter-max-servings"
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-500"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterMoreFiltersPanel
