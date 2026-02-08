import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const preparations = pgTable('preparations', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  slug: varchar({ length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
