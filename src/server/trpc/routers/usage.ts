import { protectedProcedure, router } from "../init"
import { countUserContent } from "./_helpers"

export const usageRouter = router({
  getOwned: protectedProcedure.query(async ({ ctx }) => {
    return countUserContent(ctx.user.id)
  }),
})
