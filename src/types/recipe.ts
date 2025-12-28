export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: Ingredient[]
  instructions: string[]
  prepTime: number // in minutes
  cookTime: number // in minutes
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  categoryId: string
  imageUrl?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
}

export interface Category {
  id: string
  name: string
  description: string
  imageUrl?: string
  recipeCount: number
}

export interface RecipeFilters {
  category?: string
  difficulty?: Recipe['difficulty']
  searchTerm?: string
  tags?: string[]
  maxPrepTime?: number
  maxCookTime?: number
}
