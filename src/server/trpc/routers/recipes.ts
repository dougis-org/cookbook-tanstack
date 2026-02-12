import { z } from "zod"
import { eq, and, ilike } from "drizzle-orm"
import { publicProcedure, protectedProcedure, router } from "../init"
import { visibilityFilter, verifyOwnership, syncJunction } from "./_helpers"
import {
  recipes,
  recipeMeals,
  recipeCourses,
  recipePreparations,
  recipeImages,
} from "@/db/schema"

const recipeFields = z.object({
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
})

const taxonomyIds = z.object({
  mealIds: z.array(z.string().uuid()).optional(),
  courseIds: z.array(z.string().uuid()).optional(),
  preparationIds: z.array(z.string().uuid()).optional(),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncTaxonomy(db: any, recipeId: string, input: z.infer<typeof taxonomyIds>) {
  await Promise.all([
    syncJunction(db, recipeMeals, recipeMeals.recipeId, recipeId, input.mealIds, "mealId"),
    syncJunction(db, recipeCourses, recipeCourses.recipeId, recipeId, input.courseIds, "courseId"),
    syncJunction(db, recipePreparations, recipePreparations.recipeId, recipeId, input.preparationIds, "preparationId"),
  ])
}

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

      if (input?.isPublic !== undefined) {
        conditions.push(eq(recipes.isPublic, input.isPublic))
      } else {
        conditions.push(visibilityFilter(recipes.isPublic, recipes.userId, ctx.user))
      }

      if (input?.classificationId) conditions.push(eq(recipes.classificationId, input.classificationId))
      if (input?.userId) conditions.push(eq(recipes.userId, input.userId))
      if (input?.search) conditions.push(ilike(recipes.name, `%${input.search}%`))

      return ctx.db.select().from(recipes).where(and(...conditions))
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [recipe] = await ctx.db
        .select()
        .from(recipes)
        .where(and(eq(recipes.id, input.id), visibilityFilter(recipes.isPublic, recipes.userId, ctx.user)))
      if (!recipe) return null

      const [meals, courses, preparations, images] = await Promise.all([
        ctx.db.select().from(recipeMeals).where(eq(recipeMeals.recipeId, input.id)),
        ctx.db.select().from(recipeCourses).where(eq(recipeCourses.recipeId, input.id)),
        ctx.db.select().from(recipePreparations).where(eq(recipePreparations.recipeId, input.id)),
        ctx.db.select().from(recipeImages).where(eq(recipeImages.recipeId, input.id)),
      ])

      return { ...recipe, meals, courses, preparations, images }
    }),

  create: protectedProcedure
    .input(recipeFields.merge(taxonomyIds))
    .mutation(async ({ ctx, input }) => {
      const { mealIds, courseIds, preparationIds, ...fields } = input
      return ctx.db.transaction(async (tx) => {
        const [recipe] = await tx
          .insert(recipes)
          .values({
            ...fields,
            userId: ctx.user.id,
            ingredients: fields.ingredients ?? null,
            instructions: fields.instructions ?? null,
            notes: fields.notes ?? null,
            servings: fields.servings ?? null,
            sourceId: fields.sourceId ?? null,
            classificationId: fields.classificationId ?? null,
            calories: fields.calories ?? null,
            fat: fields.fat ?? null,
            cholesterol: fields.cholesterol ?? null,
            sodium: fields.sodium ?? null,
            protein: fields.protein ?? null,
            imageUrl: fields.imageUrl ?? null,
          })
          .returning()

        await syncTaxonomy(tx, recipe.id, { mealIds, courseIds, preparationIds })
        return recipe
      })
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid() }).merge(recipeFields.partial()).merge(taxonomyIds))
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(
        () => ctx.db.select().from(recipes).where(eq(recipes.id, input.id)),
        ctx.user.id,
        "Recipe",
      )

      const { id, mealIds, courseIds, preparationIds, ...data } = input
      return ctx.db.transaction(async (tx) => {
        // Only issue UPDATE if there are scalar fields to set
        const hasScalarFields = Object.keys(data).length > 0
        const [updated] = hasScalarFields
          ? await tx.update(recipes).set(data).where(eq(recipes.id, id)).returning()
          : await tx.select().from(recipes).where(eq(recipes.id, id))

        await syncTaxonomy(tx, id, { mealIds, courseIds, preparationIds })
        return updated
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await verifyOwnership(
        () => ctx.db.select().from(recipes).where(eq(recipes.id, input.id)),
        ctx.user.id,
        "Recipe",
      )
      await ctx.db.delete(recipes).where(eq(recipes.id, input.id))
      return { success: true }
    }),
})
