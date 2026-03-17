import { vi } from 'vitest'

/**
 * Common test data and factories for filter components
 */

export const MOCK_MEALS = [
  { id: 'm1', name: 'Breakfast' },
  { id: 'm2', name: 'Lunch' },
  { id: 'm3', name: 'Dinner' },
]

export const MOCK_COURSES = [
  { id: 'c1', name: 'Appetizer' },
  { id: 'c2', name: 'Main' },
  { id: 'c3', name: 'Dessert' },
]

export const MOCK_PREPARATIONS = [
  { id: 'p1', name: 'Baked' },
  { id: 'p2', name: 'Fried' },
  { id: 'p3', name: 'Grilled' },
]

export function createMockUpdateSearch() {
  return vi.fn()
}

/**
 * Default props for FilterMoreFiltersPanel
 */
export function createDefaultFilterMoreFiltersPanelProps() {
  return {
    mealIds: undefined,
    courseIds: undefined,
    preparationIds: undefined,
    minServings: undefined,
    maxServings: undefined,
    allMeals: MOCK_MEALS,
    allCourses: MOCK_COURSES,
    allPreparations: MOCK_PREPARATIONS,
    updateSearch: createMockUpdateSearch(),
  }
}

/**
 * Default props for FilterRow1Quick
 */
export function createDefaultFilterRow1QuickProps() {
  return {
    myRecipes: false,
    markedByMe: false,
    hasImage: false,
    isLoggedIn: false,
    updateSearch: createMockUpdateSearch(),
  }
}

/**
 * Data-driven test cases for taxonomy chip selection
 * Tests: [itemType, itemId, itemName, expectedUpdateKey]
 */
export const TAXONOMY_TOGGLE_CASES = [
  ['meals', 'm1', 'Breakfast', 'mealIds'],
  ['courses', 'c1', 'Appetizer', 'courseIds'],
  ['preparations', 'p1', 'Baked', 'preparationIds'],
] as const

/**
 * Data-driven test cases for FilterRow1Quick toggles
 * Tests: [label, icon, initialState, updateKey]
 */
export const QUICK_FILTER_TOGGLE_CASES = [
  ['My Recipes', 'User', { myRecipes: false, markedByMe: false, hasImage: false }, 'myRecipes'],
  ['Favorites', 'Heart', { myRecipes: false, markedByMe: false, hasImage: false }, 'markedByMe'],
  ['Has Image', 'Image', { myRecipes: false, markedByMe: false, hasImage: false }, 'hasImage'],
] as const
