import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./columns";

export const meals = pgTable("meals", {
  id: primaryId(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  slug: varchar({ length: 255 }).unique().notNull(),
  ...timestamps(),
});
