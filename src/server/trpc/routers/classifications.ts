import { z } from "zod"
import { eq, sql } from "drizzle-orm"
import { publicProcedure, router } from "../init"
import { classifications, recipes } from "@/db/schema"

export const classificationsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: classifications.id,
        name: classifications.name,
        slug: classifications.slug,
        description: classifications.description,
        createdAt: classifications.createdAt,
        updatedAt: classifications.updatedAt,
        recipeCount: sql<number>`cast(count(${recipes.id}) as int)`,
      })
      .from(classifications)
      .leftJoin(recipes, eq(recipes.classificationId, classifications.id))
      .groupBy(classifications.id)
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
