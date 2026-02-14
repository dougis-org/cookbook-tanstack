import { z } from "zod"
import { eq, and, or, ilike, inArray, asc, desc, sql } from "drizzle-orm"
import { publicProcedure, protectedProcedure, router } from "../init"
import { visibilityFilter, verifyOwnership, syncJunction } from "./_helpers"
import {
  recipes,
  recipeMeals,
  recipeCourses,
  recipePreparations,
  recipeImages,
  recipeLikes,
} from "@/db/schema"

const recipeFields = z.object({
  name: z.string().min(1).max(500),
  ingredients: z.string().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional(),
  servings: z.number().int().positive().optional(),
  prepTime: z.number().int().positive().optional(),
  cookTime: z.number().int().positive().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
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
          mealIds: z.array(z.string().uuid()).optional(),
          courseIds: z.array(z.string().uuid()).optional(),
          preparationIds: z.array(z.string().uuid()).optional(),
          sort: z.enum(["name_asc", "name_desc", "newest", "oldest"]).optional(),
          page: z.number().int().positive().optional(),
          pageSize: z.number().int().positive().max(100).optional(),
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
      if (input?.search) {
        const pattern = `%${input.search}%`
        conditions.push(or(ilike(recipes.name, pattern), ilike(recipes.ingredients, pattern))!)
      }

      // Junction table filters — recipes that have at least one matching row
      if (input?.mealIds?.length) {
        conditions.push(
          inArray(recipes.id, ctx.db.select({ id: recipeMeals.recipeId }).from(recipeMeals).where(inArray(recipeMeals.mealId, input.mealIds))),
        )
      }
      if (input?.courseIds?.length) {
        conditions.push(
          inArray(recipes.id, ctx.db.select({ id: recipeCourses.recipeId }).from(recipeCourses).where(inArray(recipeCourses.courseId, input.courseIds))),
        )
      }
      if (input?.preparationIds?.length) {
        conditions.push(
          inArray(recipes.id, ctx.db.select({ id: recipePreparations.recipeId }).from(recipePreparations).where(inArray(recipePreparations.preparationId, input.preparationIds))),
        )
      }

      const where = and(...conditions)

      // Sort
      const sortMap = {
        name_asc: asc(recipes.name),
        name_desc: desc(recipes.name),
        newest: desc(recipes.dateAdded),
        oldest: asc(recipes.dateAdded),
      } as const
      const orderBy = sortMap[input?.sort ?? "newest"]

      // Pagination
      const page = input?.page ?? 1
      const pageSize = input?.pageSize ?? 20
      const offset = (page - 1) * pageSize

      const [items, countResult] = await Promise.all([
        ctx.db.select().from(recipes).where(where).orderBy(orderBy).limit(pageSize).offset(offset),
        ctx.db.select({ count: sql<number>`cast(count(*) as int)` }).from(recipes).where(where),
      ])

      const total = countResult[0]?.count ?? 0

      return { items, total, page, pageSize }
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
            prepTime: fields.prepTime ?? null,
            cookTime: fields.cookTime ?? null,
            difficulty: fields.difficulty ?? null,
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

  isMarked: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return { marked: false }

      const [row] = await ctx.db
        .select()
        .from(recipeLikes)
        .where(and(eq(recipeLikes.userId, ctx.user.id), eq(recipeLikes.recipeId, input.id)))

      return { marked: !!row }
    }),

  toggleMarked: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(recipeLikes)
        .where(and(eq(recipeLikes.userId, ctx.user.id), eq(recipeLikes.recipeId, input.id)))

      if (existing) {
        await ctx.db
          .delete(recipeLikes)
          .where(and(eq(recipeLikes.userId, ctx.user.id), eq(recipeLikes.recipeId, input.id)))
        return { marked: false }
      }

      await ctx.db.insert(recipeLikes).values({ userId: ctx.user.id, recipeId: input.id })
      return { marked: true }
    }),
})
