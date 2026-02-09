import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { primaryId, timestamps } from "./columns";

export const cookbooks = pgTable(
  "cookbooks",
  {
    id: primaryId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    isPublic: boolean("is_public").default(true).notNull(),
    imageUrl: text("image_url"),
    ...timestamps(),
  },
  (table) => [index("cookbooks_user_id_idx").on(table.userId)],
);
