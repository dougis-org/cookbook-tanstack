import type { FilterConfig, Row2FilterKey } from '@/lib/filterConfig'
import { DROPDOWN_CONFIGS } from './filterConfigs'
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown'

interface Classification {
  id: string
  name: string
}

interface Source {
  id: string
  name: string
}

interface FilterRow2DropdownsProps {
  classificationIds: string[] | undefined
  sourceIds: string[] | undefined
  classifications: Classification[] | undefined
  sources: Source[] | undefined
  updateSearch: (updates: { classificationIds?: string[]; sourceIds?: string[] }) => void
  filterConfig?: FilterConfig
  counts?: {
    classificationCounts?: Record<string, number>
    sourceCounts?: Record<string, number>
  }
}

export function FilterRow2Dropdowns({
  classificationIds,
  sourceIds,
  classifications,
  sources,
  updateSearch,
  filterConfig,
  counts,
}: FilterRow2DropdownsProps) {
  const dataMap = {
    classification: { selectedIds: classificationIds ?? [], options: classifications ?? [] },
    source: { selectedIds: sourceIds ?? [], options: sources ?? [] },
  }

  const shouldShowFilter = (filterKey: Row2FilterKey) =>
    !filterConfig || filterConfig.row2Filters.includes(filterKey)

  return (
    <div className="flex flex-wrap gap-2" data-testid="filter-row-2-dropdowns">
      {DROPDOWN_CONFIGS.map((cfg) => {
        if (!shouldShowFilter(cfg.filterKey)) return null

        const { selectedIds, options } = dataMap[cfg.key]

        return (
          <MultiSelectDropdown
            key={cfg.key}
            options={options}
            selectedIds={selectedIds}
            onChange={(ids) => updateSearch({ [cfg.filterKey]: ids.length ? ids : undefined })}
            placeholder={cfg.placeholder}
            label={cfg.label.toLowerCase()}
            counts={counts?.[cfg.countKey]}
            dataTestId={cfg.dataTestId}
            ariaLabel={cfg.ariaLabel}
          />
        )
      })}
    </div>
  )
}

export default FilterRow2Dropdowns
