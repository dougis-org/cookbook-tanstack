import { FILTER_DROPDOWN_CONFIGS, type FilterDropdownConfig } from './filterConfigs'
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown'

interface Option {
  id: string
  name: string
}

interface FilterDropdownsProps {
  classificationIds: string[] | undefined
  sourceIds: string[] | undefined
  mealIds: string[] | undefined
  courseIds: string[] | undefined
  preparationIds: string[] | undefined
  classifications: Option[] | undefined
  sources: Option[] | undefined
  meals: Option[] | undefined
  courses: Option[] | undefined
  preparations: Option[] | undefined
  updateSearch: (updates: {
    classificationIds?: string[] | undefined
    sourceIds?: string[] | undefined
    mealIds?: string[] | undefined
    courseIds?: string[] | undefined
    preparationIds?: string[] | undefined
  }) => void
  counts?: {
    classificationCounts?: Record<string, number>
    sourceCounts?: Record<string, number>
    mealCounts?: Record<string, number>
    courseCounts?: Record<string, number>
    preparationCounts?: Record<string, number>
  }
  configs?: FilterDropdownConfig[]
}

export function FilterDropdowns({
  classificationIds,
  sourceIds,
  mealIds,
  courseIds,
  preparationIds,
  classifications,
  sources,
  meals,
  courses,
  preparations,
  updateSearch,
  counts,
  configs = FILTER_DROPDOWN_CONFIGS,
}: FilterDropdownsProps) {
  const dataMap = {
    classification: { selectedIds: classificationIds ?? [], options: classifications ?? [] },
    source: { selectedIds: sourceIds ?? [], options: sources ?? [] },
    meal: { selectedIds: mealIds ?? [], options: meals ?? [] },
    course: { selectedIds: courseIds ?? [], options: courses ?? [] },
    preparation: { selectedIds: preparationIds ?? [], options: preparations ?? [] },
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="filter-dropdowns">
      {configs.map((cfg) => {
        const { selectedIds, options } = dataMap[cfg.key]

        return (
          <MultiSelectDropdown
            key={cfg.key}
            options={options}
            selectedIds={selectedIds}
            onChange={(ids) => updateSearch({ [cfg.filterKey]: ids.length ? ids : undefined })}
            placeholder={cfg.placeholder}
            label={cfg.label.toLowerCase()}
            labelPlural={cfg.labelPlural}
            counts={counts?.[cfg.countKey]}
            dataTestId={cfg.dataTestId}
            ariaLabel={cfg.ariaLabel}
          />
        )
      })}
    </div>
  )
}

export default FilterDropdowns
