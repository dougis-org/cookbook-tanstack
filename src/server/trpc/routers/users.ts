import { z } from "zod"
import { protectedProcedure, router } from "../init"
import { User } from "@/db/models"

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await User.findById(ctx.user.id).lean()
    return user ?? null
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
      const updated = await User.findByIdAndUpdate(
        ctx.user.id,
        { $set: input },
        { new: true },
      ).lean()
      return updated ?? null
    }),
})
