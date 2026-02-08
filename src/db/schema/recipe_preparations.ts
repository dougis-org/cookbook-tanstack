import { pgTable, uuid, primaryKey, index } from 'drizzle-orm/pg-core'
import { recipes } from './recipes'
import { preparations } from './preparations'

export const recipePreparations = pgTable(
  'recipe_preparations',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    preparationId: uuid('preparation_id')
      .notNull()
      .references(() => preparations.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.preparationId] }),
    index('recipe_preparations_recipe_id_idx').on(table.recipeId),
    index('recipe_preparations_preparation_id_idx').on(table.preparationId),
  ],
)
