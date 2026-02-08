import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const sources = pgTable('sources', {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  url: text(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
