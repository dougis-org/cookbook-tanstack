import { publicProcedure, router } from "../init"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import mongoose from "mongoose"

export const testRouter = router({
  verifyEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      // Only available in test mode
      if (process.env.NODE_ENV !== "test") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Test endpoint not available",
        })
      }

      if (mongoose.connection.readyState !== 1) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not ready",
        })
      }

      const db = mongoose.connection.db
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        })
      }

      const usersCollection = db.collection("user")
      const result = await usersCollection.updateOne(
        { email: input.email },
        { $set: { emailVerified: true } }
      )

      if (result.matchedCount === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        })
      }

      return { success: true }
    }),
})
