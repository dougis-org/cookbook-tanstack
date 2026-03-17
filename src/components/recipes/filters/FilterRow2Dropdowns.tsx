import { type FilterConfig } from '@/lib/filterConfig'
import { DROPDOWN_CONFIGS } from './filterConfigs'

interface Classification {
  id: string
  name: string
}

interface Source {
  id: string
  name: string
}

interface FilterRow2DropdownsProps {
  classificationId: string | undefined
  sourceId: string | undefined
  classifications: Classification[] | undefined
  sources: Source[] | undefined
  updateSearch: (updates: { classificationId?: string; sourceId?: string }) => void
  filterConfig?: FilterConfig
  counts?: {
    classificationCounts?: Record<string, number>
    sourceCounts?: Record<string, number>
  }
}

/**
 * FilterRow2Dropdowns - Primary filter dropdowns
 *
 * Displays dropdown selectors for Classification and Source filters.
 * Rendered via DROPDOWN_CONFIGS to eliminate duplication.
 * Counts can be optionally displayed next to each option if provided.
 * Filters rendered are configurable via filterConfig.
 */
export function FilterRow2Dropdowns({
  classificationId,
  sourceId,
  classifications,
  sources,
  updateSearch,
  filterConfig,
  counts,
}: FilterRow2DropdownsProps) {
  // Map filter data by key for easy access
  const dataMap = {
    classification: { value: classificationId, options: classifications },
    source: { value: sourceId, options: sources },
  }

  const shouldShowFilter = (filterKey: string) =>
    !filterConfig || filterConfig.row2Filters.includes(filterKey as any)

  return (
    <div className="flex flex-wrap gap-2" data-testid="filter-row-2-dropdowns">
      {DROPDOWN_CONFIGS.map((cfg) => {
        if (!shouldShowFilter(cfg.filterKey)) return null

        const data = dataMap[cfg.key]
        const { value, options } = data

        return (
          <select
            key={cfg.key}
            value={value ?? ''}
            onChange={(e) => updateSearch({ [cfg.filterKey]: e.target.value || undefined })}
            aria-label={cfg.ariaLabel}
            data-testid={cfg.dataTestId}
            className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">{cfg.placeholder}</option>
            {options?.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
                {(counts as any)?.[cfg.countKey]?.[opt.id] ?
                  ` (${(counts as any)[cfg.countKey][opt.id]})` : ''}
              </option>
            ))}
          </select>
        )
      })}
    </div>
  )
}

export default FilterRow2Dropdowns
