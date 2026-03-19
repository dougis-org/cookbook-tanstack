import { createTaxonomyRouter } from "./_helpers"
import { Course } from "@/db/models"

export const coursesRouter = createTaxonomyRouter(Course, "courseIds")
