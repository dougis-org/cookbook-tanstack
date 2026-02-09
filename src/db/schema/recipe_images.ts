import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { recipes } from "./recipes";
import { primaryId, timestamps } from "./columns";

export const recipeImages = pgTable(
  "recipe_images",
  {
    id: primaryId(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    url: text().notNull(),
    altText: text("alt_text"),
    orderIndex: integer("order_index").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    ...timestamps(),
  },
  (table) => [index("recipe_images_recipe_id_idx").on(table.recipeId)],
);
