import { z } from "zod"
import { eq, and, asc, sql, getTableColumns } from "drizzle-orm"
import { publicProcedure, protectedProcedure, router } from "../init"
import { visibilityFilter, verifyOwnership } from "./_helpers"
import { cookbooks, cookbookRecipes, recipes, classifications } from "@/db/schema"
import type { db } from "@/db"

/** Verify the current user owns the given cookbook, throwing FORBIDDEN if not. */
async function guardOwner(ctx: { db: typeof db; user: { id: string } }, id: string) {
  await verifyOwnership(
    () => ctx.db.select().from(cookbooks).where(eq(cookbooks.id, id)),
    ctx.user.id,
    "Cookbook",
  )
}

export const cookbooksRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(cookbooks)
      .where(visibilityFilter(cookbooks.isPublic, cookbooks.userId, ctx.user))
      .orderBy(asc(cookbooks.name))
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [cookbook] = await ctx.db
        .select()
        .from(cookbooks)
        .where(
          and(
            eq(cookbooks.id, input.id),
            visibilityFilter(cookbooks.isPublic, cookbooks.userId, ctx.user),
          ),
        )

      if (!cookbook) return null

      const recipeRows = await ctx.db
        .select({
          ...getTableColumns(recipes),
          classificationName: classifications.name,
          orderIndex: cookbookRecipes.orderIndex,
        })
        .from(cookbookRecipes)
        .innerJoin(recipes, eq(cookbookRecipes.recipeId, recipes.id))
        .leftJoin(classifications, eq(recipes.classificationId, classifications.id))
        .where(eq(cookbookRecipes.cookbookId, input.id))
        .orderBy(asc(cookbookRecipes.orderIndex))

      return { ...cookbook, recipes: recipeRows }
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(500).optional(),
        isPublic: z.boolean().default(true),
        imageUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [cookbook] = await ctx.db
        .insert(cookbooks)
        .values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description ?? null,
          isPublic: input.isPublic,
          imageUrl: input.imageUrl ?? null,
        })
        .returning()
      return cookbook
    }),

  update: protectedProcedure
    .input(
      z
        .object({
          id: z.string().uuid(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().max(500).optional(),
          isPublic: z.boolean().optional(),
          imageUrl: z.string().url().optional(),
        })
        .refine(
          (data) => {
            const { id: _, ...rest } = data
            return Object.keys(rest).length > 0
          },
          { message: "At least one field to update must be provided" },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      await guardOwner(ctx, input.id)
      const { id: _, ...data } = input
      const [updated] = await ctx.db
        .update(cookbooks)
        .set(data)
        .where(eq(cookbooks.id, input.id))
        .returning()
      return updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await guardOwner(ctx, input.id)
      await ctx.db.delete(cookbooks).where(eq(cookbooks.id, input.id))
      return { success: true }
    }),

  addRecipe: protectedProcedure
    .input(z.object({ cookbookId: z.string().uuid(), recipeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await guardOwner(ctx, input.cookbookId)

      const [{ count }] = await ctx.db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(cookbookRecipes)
        .where(eq(cookbookRecipes.cookbookId, input.cookbookId))

      await ctx.db
        .insert(cookbookRecipes)
        .values({ cookbookId: input.cookbookId, recipeId: input.recipeId, orderIndex: count })
        .onConflictDoNothing()

      return { success: true }
    }),

  removeRecipe: protectedProcedure
    .input(z.object({ cookbookId: z.string().uuid(), recipeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await guardOwner(ctx, input.cookbookId)
      await ctx.db
        .delete(cookbookRecipes)
        .where(
          and(
            eq(cookbookRecipes.cookbookId, input.cookbookId),
            eq(cookbookRecipes.recipeId, input.recipeId),
          ),
        )
      return { success: true }
    }),

  reorderRecipes: protectedProcedure
    .input(
      z.object({
        cookbookId: z.string().uuid(),
        recipeIds: z.array(z.string().uuid()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await guardOwner(ctx, input.cookbookId)
      await Promise.all(
        input.recipeIds.map((recipeId, index) =>
          ctx.db
            .update(cookbookRecipes)
            .set({ orderIndex: index })
            .where(
              and(
                eq(cookbookRecipes.cookbookId, input.cookbookId),
                eq(cookbookRecipes.recipeId, recipeId),
              ),
            ),
        ),
      )
      return { success: true }
    }),
})
