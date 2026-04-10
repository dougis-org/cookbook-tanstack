import { vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export interface FilterDropdownUpdates {
  classificationIds?: string[] | undefined;
  sourceIds?: string[] | undefined;
  mealIds?: string[] | undefined;
  courseIds?: string[] | undefined;
  preparationIds?: string[] | undefined;
}

export interface QuickFilterUpdates {
  myRecipes?: boolean;
  markedByMe?: boolean;
  hasImage?: boolean;
}

export const MOCK_MEALS = [
  { id: "m1", name: "Breakfast" },
  { id: "m2", name: "Lunch" },
  { id: "m3", name: "Dinner" },
];

export const MOCK_COURSES = [
  { id: "c1", name: "Appetizer" },
  { id: "c2", name: "Main" },
  { id: "c3", name: "Dessert" },
];

export const MOCK_PREPARATIONS = [
  { id: "p1", name: "Baked" },
  { id: "p2", name: "Fried" },
  { id: "p3", name: "Grilled" },
];

export function createMockUpdateSearch() {
  return vi.fn();
}

export function createMockFilterDropdownUpdateSearch() {
  return vi.fn<(updates: FilterDropdownUpdates) => void>();
}

export function createMockQuickFilterUpdateSearch() {
  return vi.fn<(updates: QuickFilterUpdates) => void>();
}

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
  };
}

export function createDefaultFilterRow1QuickProps() {
  return {
    myRecipes: false,
    markedByMe: false,
    hasImage: false,
    isLoggedIn: false,
    updateSearch: createMockQuickFilterUpdateSearch(),
  };
}

/** [taxonomyType, itemId, itemName, updateKey] */
export const TAXONOMY_TOGGLE_CASES = [
  ["meals", "m1", "Breakfast", "mealIds"],
  ["courses", "c1", "Appetizer", "courseIds"],
  ["preparations", "p1", "Baked", "preparationIds"],
] as const;

/** [label, updateKey] */
export const QUICK_FILTER_TOGGLE_CASES = [
  ["My Recipes", "myRecipes"],
  ["Favorites", "markedByMe"],
  ["Has Image", "hasImage"],
] as const;

export async function expandFilterPanel() {
  const user = userEvent.setup();
  const toggleButton = screen.getByTestId("filter-more-filters-toggle");
  await user.click(toggleButton);
  return user;
}
