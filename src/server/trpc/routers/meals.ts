import { publicProcedure, router } from "../init"
import { meals } from "@/db/schema"

export const mealsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(meals)
  }),
})
