import type { FilterConfig, Row2FilterKey } from '@/lib/filterConfig'
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

export function FilterRow2Dropdowns({
  classificationId,
  sourceId,
  classifications,
  sources,
  updateSearch,
  filterConfig,
  counts,
}: FilterRow2DropdownsProps) {
  const dataMap = {
    classification: { value: classificationId, options: classifications },
    source: { value: sourceId, options: sources },
  }

  const shouldShowFilter = (filterKey: Row2FilterKey) =>
    !filterConfig || filterConfig.row2Filters.includes(filterKey)

  return (
    <div className="flex flex-wrap gap-2" data-testid="filter-row-2-dropdowns">
      {DROPDOWN_CONFIGS.map((cfg) => {
        if (!shouldShowFilter(cfg.filterKey)) return null

        const { value, options } = dataMap[cfg.key]

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
            {options?.map((opt) => {
              const count = counts?.[cfg.countKey]?.[opt.id]
              return (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                  {count !== undefined ? ` (${count})` : ''}
                </option>
              )
            })}
          </select>
        )
      })}
    </div>
  )
}

export default FilterRow2Dropdowns
