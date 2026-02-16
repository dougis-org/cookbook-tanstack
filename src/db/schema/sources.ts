import { pgTable, varchar, text } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./columns";

export const sources = pgTable("sources", {
  id: primaryId(),
  name: varchar({ length: 255 }).notNull(),
  url: text(),
  ...timestamps(),
});
