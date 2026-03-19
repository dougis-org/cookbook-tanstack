export interface TaxonomyConfig {
  key: 'meals' | 'courses' | 'preparations'
  label: string
  filterKey: 'mealIds' | 'courseIds' | 'preparationIds'
  countKey: 'mealCounts' | 'courseCounts' | 'preparationCounts'
}

export const TAXONOMY_CONFIGS: TaxonomyConfig[] = [
  {
    key: 'meals',
    label: 'Meals',
    filterKey: 'mealIds',
    countKey: 'mealCounts',
  },
  {
    key: 'courses',
    label: 'Courses',
    filterKey: 'courseIds',
    countKey: 'courseCounts',
  },
  {
    key: 'preparations',
    label: 'Preparations',
    filterKey: 'preparationIds',
    countKey: 'preparationCounts',
  },
]

export interface DropdownConfig {
  key: 'classification' | 'source'
  label: string
  placeholder: string
  filterKey: 'classificationId' | 'sourceId'
  countKey: 'classificationCounts' | 'sourceCounts'
  dataTestId: string
  ariaLabel: string
}

export const DROPDOWN_CONFIGS: DropdownConfig[] = [
  {
    key: 'classification',
    label: 'Classification',
    placeholder: 'All Categories',
    filterKey: 'classificationId',
    countKey: 'classificationCounts',
    dataTestId: 'filter-dropdown-classification',
    ariaLabel: 'Filter by category',
  },
  {
    key: 'source',
    label: 'Source',
    placeholder: 'All Sources',
    filterKey: 'sourceId',
    countKey: 'sourceCounts',
    dataTestId: 'filter-dropdown-source',
    ariaLabel: 'Filter by source',
  },
]
