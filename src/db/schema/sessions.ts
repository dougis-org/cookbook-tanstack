import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { primaryId } from "./columns";
import { users } from "./users";

export const sessions = pgTable("sessions", {
  id: primaryId(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text().unique().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
