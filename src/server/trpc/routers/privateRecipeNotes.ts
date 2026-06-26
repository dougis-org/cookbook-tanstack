import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { Types } from "mongoose"
import { protectedProcedure, tierProcedure, router } from "../init"
import { Recipe, RecipeNote } from "@/db/models"
import { canUsePrivateRecipeNotes } from "@/lib/tier-entitlements"
import { objectId } from "./_helpers"

export const privateRecipeNotesRouter = router({
  get: protectedProcedure
    .input(z.object({ recipeId: objectId }))
    .query(async ({ ctx, input }) => {
      const userId = new Types.ObjectId(ctx.user.id)
      const recipeId = new Types.ObjectId(input.recipeId)
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
      const userId = new Types.ObjectId(ctx.user.id)
      const recipeId = new Types.ObjectId(input.recipeId)
      const recipe = await Recipe.findOne({
        _id: recipeId,
        $or: [{ isPublic: true }, { userId }],
        deleted: { $ne: true },
        hiddenByTier: { $ne: true },
        pendingVerification: { $ne: true },
      }).lean()
      if (!recipe) throw new TRPCError({ code: "NOT_FOUND" })
      await RecipeNote.findOneAndUpdate(
        { userId, recipeId },
        { body: input.body },
        { upsert: true, runValidators: true },
      )
      return { success: true }
    }),

  delete: tierProcedure("sous-chef")
    .input(z.object({ recipeId: objectId }))
    .mutation(async ({ ctx, input }) => {
      const userId = new Types.ObjectId(ctx.user.id)
      const recipeId = new Types.ObjectId(input.recipeId)
      const result = await RecipeNote.deleteOne({ userId, recipeId })
      if (result.deletedCount === 0) throw new TRPCError({ code: "NOT_FOUND" })
      return { success: true }
    }),
})
