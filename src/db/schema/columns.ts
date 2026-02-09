import { timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Creates a UUID primary key column with automatic random generation
 */
export function primaryId() {
  return uuid().defaultRandom().primaryKey();
}

/**
 * Creates standard createdAt and updatedAt timestamp columns
 * createdAt: Auto-populated on insert, never changes
 * updatedAt: Auto-populated on insert, auto-updated on any record change
 */
export function timestamps() {
  return {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  };
}
