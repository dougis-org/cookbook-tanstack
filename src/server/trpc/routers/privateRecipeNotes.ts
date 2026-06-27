import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { Types } from "mongoose"
import { protectedProcedure, tierProcedure, router } from "../init"
import { Recipe, RecipeNote } from "@/db/models"
import { canUsePrivateRecipeNotes } from "@/lib/tier-entitlements"
import { objectId, visibilityFilter } from "./_helpers"

function toIds(userId: string, recipeId: string) {
  return {
    userId: new Types.ObjectId(userId),
    recipeId: new Types.ObjectId(recipeId),
  }
}

export const privateRecipeNotesRouter = router({
  get: protectedProcedure
    .input(z.object({ recipeId: objectId }))
    .query(async ({ ctx, input }) => {
      const { userId, recipeId } = toIds(ctx.user.id, input.recipeId)
      if (!canUsePrivateRecipeNotes(ctx.user.tier)) {
        const exists = await RecipeNote.exists({ userId, recipeId })
        return { hasNote: !!exists, note: null }
      }
      const note = await RecipeNote.findOne({ userId, recipeId }, { body: 1, updatedAt: 1 }).lean()
      if (!note) return { hasNote: false, note: null }
      return { hasNote: true, note: { body: note.body, updatedAt: note.updatedAt } }
    }),

  upsert: tierProcedure("sous-chef")
    .input(z.object({ recipeId: objectId, body: z.string().max(10000) }))
    .mutation(async ({ ctx, input }) => {
      const { userId, recipeId } = toIds(ctx.user.id, input.recipeId)
      const recipe = await Recipe.findOne({
        _id: recipeId,
        ...visibilityFilter(ctx.user),
        deleted: { $ne: true },
      }).lean()
      if (!recipe) throw new TRPCError({ code: "NOT_FOUND", message: "Recipe not found" })
      await RecipeNote.findOneAndUpdate(
        { userId, recipeId },
        { $set: { body: input.body } },
        { upsert: true, runValidators: true },
      )
      return { success: true }
    }),

  delete: tierProcedure("sous-chef")
    .input(z.object({ recipeId: objectId }))
    .mutation(async ({ ctx, input }) => {
      const { userId, recipeId } = toIds(ctx.user.id, input.recipeId)
      const result = await RecipeNote.deleteOne({ userId, recipeId })
      if (result.deletedCount === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" })
      return { success: true }
    }),
})
