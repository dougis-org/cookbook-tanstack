import { createTaxonomyRouter } from "./_helpers"
import { Meal } from "@/db/models"

export const mealsRouter = createTaxonomyRouter(Meal, "mealIds")
