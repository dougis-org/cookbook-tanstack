import { z } from "zod"
import { ObjectId } from "mongodb"
import { protectedProcedure, router } from "../init"
import { getMongoClient } from "@/db"

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    // ctx.user is already populated from Better-Auth's session
    // Return it directly without additional database queries
    return ctx.user ?? null
  }),

  updateProfile: protectedProcedure
    .input(
      z
        .object({
          name: z.string().min(1).max(255).optional(),
          image: z.string().url().optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
          message: "At least one field must be provided",
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getMongoClient().db()
      const usersCollection = db.collection("user")

      // Query by both _id formats to ensure we find the document
      const userId = ctx.user.id
      let objectId: ObjectId
      try {
        objectId = new ObjectId(userId)
      } catch {
        return null
      }

      const updated = await usersCollection.findOneAndUpdate(
        { _id: objectId },
        { $set: { ...input, updatedAt: new Date() } },
        { returnDocument: "after" },
      )

      return updated.value ?? null
    }),
})
