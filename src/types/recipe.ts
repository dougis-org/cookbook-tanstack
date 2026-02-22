import type { InferSelectModel } from "drizzle-orm"
import type { recipes, classifications } from "@/db/schema"

/** Row returned by a `select().from(recipes)` query. */
export type Recipe = InferSelectModel<typeof recipes>

/** The difficulty values accepted by the recipes table. */
export type Difficulty = "easy" | "medium" | "hard"

/** Row returned by a `select().from(classifications)` query. */
export type Classification = InferSelectModel<typeof classifications>

/** Classification with a computed recipe count (from the list query). */
export interface ClassificationWithCount extends Classification {
  recipeCount: number
}

/** A resolved taxonomy item (meal, course, or preparation) with its name. */
export interface TaxonomyItem {
  id: string
  name: string
}

/** Filters accepted by the recipe list query. */
export interface RecipeFilters {
  classificationId?: string
  difficulty?: Difficulty
  search?: string
  maxPrepTime?: number
  maxCookTime?: number
}
