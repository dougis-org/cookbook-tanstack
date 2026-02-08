import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  real,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { sources } from './sources'
import { classifications } from './classifications'

export const recipes = pgTable(
  'recipes',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar({ length: 500 }).notNull(),
    ingredients: text(),
    instructions: text(),
    notes: text(),
    servings: integer(),
    sourceId: uuid('source_id').references(() => sources.id, {
      onDelete: 'set null',
    }),
    classificationId: uuid('classification_id').references(
      () => classifications.id,
      { onDelete: 'set null' },
    ),
    dateAdded: timestamp('date_added').defaultNow().notNull(),
    calories: integer(),
    fat: real(),
    cholesterol: real(),
    sodium: real(),
    protein: real(),
    marked: boolean().default(false).notNull(),
    imageUrl: text('image_url'),
    isPublic: boolean('is_public').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('recipes_user_id_idx').on(table.userId),
    index('recipes_source_id_idx').on(table.sourceId),
    index('recipes_classification_id_idx').on(table.classificationId),
    index('recipes_name_idx').on(table.name),
  ],
)
