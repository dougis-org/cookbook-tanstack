import { pgTable, uuid, integer, primaryKey, index } from 'drizzle-orm/pg-core'
import { cookbooks } from './cookbooks'
import { recipes } from './recipes'

export const cookbookRecipes = pgTable(
  'cookbook_recipes',
  {
    cookbookId: uuid('cookbook_id')
      .notNull()
      .references(() => cookbooks.id, { onDelete: 'cascade' }),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index'),
  },
  (table) => [
    primaryKey({ columns: [table.cookbookId, table.recipeId] }),
    index('cookbook_recipes_cookbook_id_idx').on(table.cookbookId),
    index('cookbook_recipes_recipe_id_idx').on(table.recipeId),
  ],
)
