/**
 * Filter Configuration for Recipe List UI
 *
 * This configuration determines which filters appear in each layer of the recipe filter UI:
 * - QUICK_FILTERS: Always visible (My Recipes, Favorites, Has Image)
 * - ROW_2_FILTERS: Always visible dropdowns (Classification, Source)
 * - ALL_FILTERS_ITEMS: Collapsible panel containing remaining filters (Meals, Courses, Preparations, Servings)
 *
 * To reorganize filters between layers, simply update the arrays below.
 * This design supports future user preference features to customize filter layout.
 */

export const QUICK_FILTERS = ['myRecipes', 'markedByMe', 'hasImage'] as const

export const ROW_2_FILTERS = ['classificationId', 'sourceId'] as const

export const ALL_FILTERS_ITEMS = ['mealIds', 'courseIds', 'preparationIds', 'minServings', 'maxServings'] as const

export type QuickFilterKey = typeof QUICK_FILTERS[number]
export type Row2FilterKey = typeof ROW_2_FILTERS[number]
export type AllFiltersKey = typeof ALL_FILTERS_ITEMS[number]

/** Configuration object that can be passed to components for customization */
export interface FilterConfig {
  quickFilters: readonly string[]
  row2Filters: readonly string[]
  allFilters: readonly string[]
}

/** Default configuration export */
const filterConfig: FilterConfig = {
  quickFilters: QUICK_FILTERS,
  row2Filters: ROW_2_FILTERS,
  allFilters: ALL_FILTERS_ITEMS,
}

export default filterConfig
