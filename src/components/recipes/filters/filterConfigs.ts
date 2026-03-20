export interface FilterDropdownConfig {
  key: string
  label: string
  labelPlural?: string
  placeholder: string
  filterKey: string
  countKey: string
  dataTestId: string
  ariaLabel: string
}

// Order here = default display order for all users.
// This array is the global default; future work can allow users to
// store a reordered copy of these keys in their preferences and
// pass a sorted version to FilterDropdowns without changing this file.
export const FILTER_DROPDOWN_CONFIGS: FilterDropdownConfig[] = [
  {
    key: 'classification',
    label: 'Category',
    labelPlural: 'categories',
    placeholder: 'All Categories',
    filterKey: 'classificationIds',
    countKey: 'classificationCounts',
    dataTestId: 'filter-dropdown-classification',
    ariaLabel: 'Filter by category',
  },
  {
    key: 'source',
    label: 'Source',
    placeholder: 'All Sources',
    filterKey: 'sourceIds',
    countKey: 'sourceCounts',
    dataTestId: 'filter-dropdown-source',
    ariaLabel: 'Filter by source',
  },
  {
    key: 'meal',
    label: 'Meal',
    placeholder: 'All Meals',
    filterKey: 'mealIds',
    countKey: 'mealCounts',
    dataTestId: 'filter-dropdown-meal',
    ariaLabel: 'Filter by meal',
  },
  {
    key: 'course',
    label: 'Course',
    placeholder: 'All Courses',
    filterKey: 'courseIds',
    countKey: 'courseCounts',
    dataTestId: 'filter-dropdown-course',
    ariaLabel: 'Filter by course',
  },
  {
    key: 'preparation',
    label: 'Preparation',
    placeholder: 'All Preparations',
    filterKey: 'preparationIds',
    countKey: 'preparationCounts',
    dataTestId: 'filter-dropdown-preparation',
    ariaLabel: 'Filter by preparation',
  },
]
