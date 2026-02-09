import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { recipes } from './recipes'

export const recipeLikes = pgTable(
  'recipe_likes',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.recipeId] }),
    index('recipe_likes_user_id_idx').on(table.userId),
    index('recipe_likes_recipe_id_idx').on(table.recipeId),
  ],
)
