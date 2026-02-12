import { router } from "./init"
import { recipesRouter } from "./routers/recipes"
import { cookbooksRouter } from "./routers/cookbooks"
import { classificationsRouter } from "./routers/classifications"
import { sourcesRouter } from "./routers/sources"
import { mealsRouter } from "./routers/meals"
import { coursesRouter } from "./routers/courses"
import { preparationsRouter } from "./routers/preparations"
import { usersRouter } from "./routers/users"

export const appRouter = router({
  recipes: recipesRouter,
  cookbooks: cookbooksRouter,
  classifications: classificationsRouter,
  sources: sourcesRouter,
  meals: mealsRouter,
  courses: coursesRouter,
  preparations: preparationsRouter,
  users: usersRouter,
})

export type AppRouter = typeof appRouter
