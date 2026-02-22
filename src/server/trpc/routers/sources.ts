import { z } from "zod"
import { eq, ilike } from "drizzle-orm"
import { publicProcedure, protectedProcedure, router } from "../init"
import { sources } from "@/db/schema"

export const sourcesRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(sources)
  }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const escaped = input.query.replace(/[%_]/g, "\\$&")
      return ctx.db.select().from(sources).where(ilike(sources.name, `%${escaped}%`)).limit(10)
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [source] = await ctx.db
        .select()
        .from(sources)
        .where(eq(sources.id, input.id))
      return source ?? null
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        url: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [source] = await ctx.db
        .insert(sources)
        .values({ name: input.name, url: input.url ?? null })
        .returning()
      return source
    }),
})
