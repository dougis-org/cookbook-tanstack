import { createTaxonomyRouter } from "./_helpers"
import { meals } from "@/db/schema"

export const mealsRouter = createTaxonomyRouter(meals)
