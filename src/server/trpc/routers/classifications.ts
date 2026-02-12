import { z } from "zod"
import { eq } from "drizzle-orm"
import { publicProcedure, router } from "../init"
import { classifications } from "@/db/schema"

export const classificationsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(classifications)
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [classification] = await ctx.db
        .select()
        .from(classifications)
        .where(eq(classifications.id, input.id))
      return classification ?? null
    }),
})
