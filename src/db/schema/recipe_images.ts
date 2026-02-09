import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core'
import { recipes } from './recipes'

export const recipeImages = pgTable(
  'recipe_images',
  {
    id: uuid().defaultRandom().primaryKey(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    url: text().notNull(),
    altText: text('alt_text'),
    orderIndex: integer('order_index').default(0).notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('recipe_images_recipe_id_idx').on(table.recipeId)],
)
