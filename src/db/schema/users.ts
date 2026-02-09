import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./columns";

export const users = pgTable("users", {
  id: primaryId(),
  email: varchar({ length: 255 }).unique().notNull(),
  username: varchar({ length: 100 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: varchar({ length: 255 }),
  avatarUrl: text("avatar_url"),
  ...timestamps(),
});
