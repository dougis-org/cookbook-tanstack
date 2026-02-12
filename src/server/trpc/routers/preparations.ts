import { publicProcedure, router } from "../init"
import { preparations } from "@/db/schema"

export const preparationsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(preparations)
  }),
})
