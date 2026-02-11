import { pgTable, varchar, text, boolean } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./columns";

export const users = pgTable("users", {
  id: primaryId(),
  email: varchar({ length: 255 }).unique().notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  username: varchar({ length: 100 }).unique().notNull(),
  name: varchar({ length: 255 }),
  image: text(),
  ...timestamps(),
});
