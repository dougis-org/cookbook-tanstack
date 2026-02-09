import { pgTable, uuid, primaryKey, index } from 'drizzle-orm/pg-core'
import { recipes } from './recipes'
import { meals } from './meals'

export const recipeMeals = pgTable(
  'recipe_meals',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    mealId: uuid('meal_id')
      .notNull()
      .references(() => meals.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.mealId] }),
    index('recipe_meals_recipe_id_idx').on(table.recipeId),
    index('recipe_meals_meal_id_idx').on(table.mealId),
  ],
)
