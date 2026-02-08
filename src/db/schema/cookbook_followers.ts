import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { cookbooks } from './cookbooks'

export const cookbookFollowers = pgTable(
  'cookbook_followers',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cookbookId: uuid('cookbook_id')
      .notNull()
      .references(() => cookbooks.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.cookbookId] }),
    index('cookbook_followers_user_id_idx').on(table.userId),
    index('cookbook_followers_cookbook_id_idx').on(table.cookbookId),
  ],
)
