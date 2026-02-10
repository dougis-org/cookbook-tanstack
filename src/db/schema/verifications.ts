import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { primaryId } from "./columns";

export const verifications = pgTable("verifications", {
  id: primaryId(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
