/** The difficulty values accepted by the recipe schema. */
export type Difficulty = "easy" | "medium" | "hard";

/** Recipe document as returned by the tRPC `recipes.byId` and `recipes.list` queries. */
export interface Recipe {
  id: string;
  userId: string;
  name: string;
  ingredients: string | null;
  instructions: string | null;
  notes: string | null;
  servings: number | null;
  prepTime: number | null;
  cookTime: number | null;
  difficulty: Difficulty | null;
  sourceId: string | null;
  classificationId: string | null;
  dateAdded: Date | null;
  calories: number | null;
  fat: number | null;
  cholesterol: number | null;
  sodium: number | null;
  protein: number | null;
  imageUrl: string | null;
  isPublic: boolean;
  marked: boolean;
  mealIds?: string[];
  courseIds?: string[];
  preparationIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** Classification document as returned by the tRPC `classifications` queries. */
export interface Classification {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Classification with a computed recipe count (from the list query). */
export interface ClassificationWithCount extends Classification {
  recipeCount: number;
}

/** A resolved taxonomy item (meal, course, or preparation) with its name. */
export interface TaxonomyItem {
  id: string;
  name: string;
}

/** Filters accepted by the recipe list query. */
export interface RecipeFilters {
  classificationId?: string;
  difficulty?: Difficulty;
  search?: string;
  maxPrepTime?: number;
  maxCookTime?: number;
}
