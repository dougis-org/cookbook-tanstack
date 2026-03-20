
export const QUICK_FILTERS = ['myRecipes', 'markedByMe', 'hasImage'] as const

export const ROW_2_FILTERS = ['classificationIds', 'sourceIds'] as const

export const ALL_FILTERS_ITEMS = [
  'mealIds',
  'courseIds',
  'preparationIds',
  'minServings',
  'maxServings',
] as const

export type QuickFilterKey = (typeof QUICK_FILTERS)[number]
export type Row2FilterKey = (typeof ROW_2_FILTERS)[number]
export type AllFiltersKey = (typeof ALL_FILTERS_ITEMS)[number]

/** Configuration object that can be passed to components for customization */
export interface FilterConfig {
  quickFilters: readonly QuickFilterKey[]
  row2Filters: readonly Row2FilterKey[]
  allFilters: readonly AllFiltersKey[]
}

/** Default configuration export */
const filterConfig: FilterConfig = {
  quickFilters: QUICK_FILTERS,
  row2Filters: ROW_2_FILTERS,
  allFilters: ALL_FILTERS_ITEMS,
}

export default filterConfig
