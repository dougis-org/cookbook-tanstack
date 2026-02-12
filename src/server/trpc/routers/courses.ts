import { publicProcedure, router } from "../init"
import { courses } from "@/db/schema"

export const coursesRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(courses)
  }),
})
