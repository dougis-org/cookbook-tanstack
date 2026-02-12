import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { publicProcedure, protectedProcedure, router } from "../init"
import { visibilityFilter, verifyOwnership } from "./_helpers"
import { cookbooks, cookbookRecipes } from "@/db/schema"

export const cookbooksRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(cookbooks)
      .where(visibilityFilter(cookbooks.isPublic, cookbooks.userId, ctx.user))
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

      const recipes = await ctx.db
        .select()
        .from(cookbookRecipes)
        .where(eq(cookbookRecipes.cookbookId, input.id))

      return { ...cookbook, recipes }
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
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
          description: z.string().optional(),
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
      await verifyOwnership(
        () => ctx.db.select().from(cookbooks).where(eq(cookbooks.id, input.id)),
        ctx.user.id,
        "Cookbook",
      )

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
      await verifyOwnership(
        () => ctx.db.select().from(cookbooks).where(eq(cookbooks.id, input.id)),
        ctx.user.id,
        "Cookbook",
      )
      await ctx.db.delete(cookbooks).where(eq(cookbooks.id, input.id))
      return { success: true }
    }),
})
