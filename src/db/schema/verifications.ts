import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./columns";

export const verifications = pgTable("verifications", {
  id: primaryId(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ...timestamps(),
});
