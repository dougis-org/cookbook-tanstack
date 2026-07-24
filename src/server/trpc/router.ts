import { router } from "./init"
import { recipesRouter } from "./routers/recipes"
import { cookbooksRouter } from "./routers/cookbooks"
import { classificationsRouter } from "./routers/classifications"
import { sourcesRouter } from "./routers/sources"
import { mealsRouter } from "./routers/meals"
import { coursesRouter } from "./routers/courses"
import { preparationsRouter } from "./routers/preparations"
import { usersRouter } from "./routers/users"
import { adminRouter } from "./routers/admin"
import { usageRouter } from "./routers/usage"
import { notificationsRouter } from "./routers/notifications"
import { privateRecipeNotesRouter } from "./routers/privateRecipeNotes"
import { alexaRouter } from "./routers/alexa"

export const appRouter = router({
  recipes: recipesRouter,
  cookbooks: cookbooksRouter,
  classifications: classificationsRouter,
  sources: sourcesRouter,
  meals: mealsRouter,
  courses: coursesRouter,
  preparations: preparationsRouter,
  users: usersRouter,
  admin: adminRouter,
  usage: usageRouter,
  notifications: notificationsRouter,
  privateRecipeNotes: privateRecipeNotesRouter,
  alexa: alexaRouter,
})

export type AppRouter = typeof appRouter
