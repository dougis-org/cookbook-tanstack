import { z } from "zod"
import { eq, and, ilike } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import { publicProcedure, protectedProcedure, router } from "../init"
import {
  recipes,
  recipeMeals,
  recipeCourses,
  recipePreparations,
  recipeImages,
} from "@/db/schema"

export const recipesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          classificationId: z.string().uuid().optional(),
          userId: z.string().uuid().optional(),
          isPublic: z.boolean().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const conditions = []

      if (input?.classificationId) {
        conditions.push(
          eq(recipes.classificationId, input.classificationId),
        )
      }
      if (input?.userId) {
        conditions.push(eq(recipes.userId, input.userId))
      }
      if (input?.isPublic !== undefined) {
        conditions.push(eq(recipes.isPublic, input.isPublic))
      }
      if (input?.search) {
        conditions.push(ilike(recipes.name, `%${input.search}%`))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      return ctx.db.select().from(recipes).where(where)
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [recipe] = await ctx.db
        .select()
        .from(recipes)
        .where(eq(recipes.id, input.id))

      if (!recipe) return null

      const [mealRows, courseRows, preparationRows, imageRows] =
        await Promise.all([
          ctx.db
            .select()
            .from(recipeMeals)
            .where(eq(recipeMeals.recipeId, input.id)),
          ctx.db
            .select()
            .from(recipeCourses)
            .where(eq(recipeCourses.recipeId, input.id)),
          ctx.db
            .select()
            .from(recipePreparations)
            .where(eq(recipePreparations.recipeId, input.id)),
          ctx.db
            .select()
            .from(recipeImages)
            .where(eq(recipeImages.recipeId, input.id)),
        ])

      return {
        ...recipe,
        meals: mealRows,
        courses: courseRows,
        preparations: preparationRows,
        images: imageRows,
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(500),
        ingredients: z.string().optional(),
        instructions: z.string().optional(),
        notes: z.string().optional(),
        servings: z.number().int().positive().optional(),
        sourceId: z.string().uuid().optional(),
        classificationId: z.string().uuid().optional(),
        calories: z.number().int().nonnegative().optional(),
        fat: z.number().nonnegative().optional(),
        cholesterol: z.number().nonnegative().optional(),
        sodium: z.number().nonnegative().optional(),
        protein: z.number().nonnegative().optional(),
        imageUrl: z.string().url().optional(),
        isPublic: z.boolean().default(true),
        mealIds: z.array(z.string().uuid()).optional(),
        courseIds: z.array(z.string().uuid()).optional(),
        preparationIds: z.array(z.string().uuid()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { mealIds, courseIds, preparationIds, ...recipeData } = input

      const [recipe] = await ctx.db
        .insert(recipes)
        .values({
          ...recipeData,
          userId: ctx.user.id,
          ingredients: recipeData.ingredients ?? null,
          instructions: recipeData.instructions ?? null,
          notes: recipeData.notes ?? null,
          servings: recipeData.servings ?? null,
          sourceId: recipeData.sourceId ?? null,
          classificationId: recipeData.classificationId ?? null,
          calories: recipeData.calories ?? null,
          fat: recipeData.fat ?? null,
          cholesterol: recipeData.cholesterol ?? null,
          sodium: recipeData.sodium ?? null,
          protein: recipeData.protein ?? null,
          imageUrl: recipeData.imageUrl ?? null,
        })
        .returning()

      if (mealIds?.length) {
        await ctx.db
          .insert(recipeMeals)
          .values(mealIds.map((mealId) => ({ recipeId: recipe.id, mealId })))
      }
      if (courseIds?.length) {
        await ctx.db
          .insert(recipeCourses)
          .values(
            courseIds.map((courseId) => ({ recipeId: recipe.id, courseId })),
          )
      }
      if (preparationIds?.length) {
        await ctx.db
          .insert(recipePreparations)
          .values(
            preparationIds.map((preparationId) => ({
              recipeId: recipe.id,
              preparationId,
            })),
          )
      }

      return recipe
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(500).optional(),
        ingredients: z.string().optional(),
        instructions: z.string().optional(),
        notes: z.string().optional(),
        servings: z.number().int().positive().optional(),
        sourceId: z.string().uuid().optional(),
        classificationId: z.string().uuid().optional(),
        calories: z.number().int().nonnegative().optional(),
        fat: z.number().nonnegative().optional(),
        cholesterol: z.number().nonnegative().optional(),
        sodium: z.number().nonnegative().optional(),
        protein: z.number().nonnegative().optional(),
        imageUrl: z.string().url().optional(),
        isPublic: z.boolean().optional(),
        mealIds: z.array(z.string().uuid()).optional(),
        courseIds: z.array(z.string().uuid()).optional(),
        preparationIds: z.array(z.string().uuid()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(recipes)
        .where(eq(recipes.id, input.id))

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recipe not found" })
      }
      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your recipe" })
      }

      const { id: _, mealIds, courseIds, preparationIds, ...data } = input

      const [updated] = await ctx.db
        .update(recipes)
        .set(data)
        .where(eq(recipes.id, input.id))
        .returning()

      if (mealIds !== undefined) {
        await ctx.db
          .delete(recipeMeals)
          .where(eq(recipeMeals.recipeId, input.id))
        if (mealIds.length) {
          await ctx.db
            .insert(recipeMeals)
            .values(
              mealIds.map((mealId) => ({ recipeId: input.id, mealId })),
            )
        }
      }
      if (courseIds !== undefined) {
        await ctx.db
          .delete(recipeCourses)
          .where(eq(recipeCourses.recipeId, input.id))
        if (courseIds.length) {
          await ctx.db
            .insert(recipeCourses)
            .values(
              courseIds.map((courseId) => ({ recipeId: input.id, courseId })),
            )
        }
      }
      if (preparationIds !== undefined) {
        await ctx.db
          .delete(recipePreparations)
          .where(eq(recipePreparations.recipeId, input.id))
        if (preparationIds.length) {
          await ctx.db
            .insert(recipePreparations)
            .values(
              preparationIds.map((preparationId) => ({
                recipeId: input.id,
                preparationId,
              })),
            )
        }
      }

      return updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(recipes)
        .where(eq(recipes.id, input.id))

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recipe not found" })
      }
      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your recipe" })
      }

      await ctx.db.delete(recipes).where(eq(recipes.id, input.id))
      return { success: true }
    }),
})
