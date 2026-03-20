import { FILTER_DROPDOWN_CONFIGS } from './filterConfigs'
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
  allMeals: Option[] | undefined
  allCourses: Option[] | undefined
  allPreparations: Option[] | undefined
  updateSearch: (updates: {
    classificationIds?: string[]
    sourceIds?: string[]
    mealIds?: string[]
    courseIds?: string[]
    preparationIds?: string[]
  }) => void
  counts?: {
    classificationCounts?: Record<string, number>
    sourceCounts?: Record<string, number>
    mealCounts?: Record<string, number>
    courseCounts?: Record<string, number>
    preparationCounts?: Record<string, number>
  }
}

export function FilterDropdowns({
  classificationIds,
  sourceIds,
  mealIds,
  courseIds,
  preparationIds,
  classifications,
  sources,
  allMeals,
  allCourses,
  allPreparations,
  updateSearch,
  counts,
}: FilterDropdownsProps) {
  const dataMap: Record<string, { selectedIds: string[]; options: Option[] }> = {
    classification: { selectedIds: classificationIds ?? [], options: classifications ?? [] },
    source: { selectedIds: sourceIds ?? [], options: sources ?? [] },
    meal: { selectedIds: mealIds ?? [], options: allMeals ?? [] },
    course: { selectedIds: courseIds ?? [], options: allCourses ?? [] },
    preparation: { selectedIds: preparationIds ?? [], options: allPreparations ?? [] },
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="filter-dropdowns">
      {FILTER_DROPDOWN_CONFIGS.map((cfg) => {
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
            counts={counts?.[cfg.countKey as keyof typeof counts] as Record<string, number> | undefined}
            dataTestId={cfg.dataTestId}
            ariaLabel={cfg.ariaLabel}
          />
        )
      })}
    </div>
  )
}

export default FilterDropdowns
