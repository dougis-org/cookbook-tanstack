import { z } from 'zod'
import { ObjectId } from 'mongodb'
import { TRPCError } from '@trpc/server'
import { adminProcedure, router } from '../init'
import { getMongoClient } from '@/db'
import { transformUserDoc } from './users'
import type { UserTier } from '@/types/user'

const USER_TIERS = ['home-cook', 'prep-cook', 'sous-chef', 'executive-chef'] as const

const usersRouter = router({
  list: adminProcedure.query(async () => {
    const users = await getMongoClient()
      .db()
      .collection('user')
      .find({})
      .toArray()

    return users.map(transformUserDoc).filter(Boolean) as NonNullable<
      ReturnType<typeof transformUserDoc>
    >[]
  }),

  setTier: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tier: z.enum(USER_TIERS),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot change your own tier',
        })
      }

      let targetObjectId: ObjectId
      try {
        targetObjectId = new ObjectId(input.userId)
      } catch {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid user ID' })
      }

      const usersCollection = getMongoClient().db().collection('user')
      const targetUser = await usersCollection.findOne({ _id: targetObjectId })

      if (!targetUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      const currentTier = (targetUser.tier as UserTier | undefined) ?? 'home-cook'

      if (currentTier === input.tier) {
        return { success: true, noOp: true }
      }

      await usersCollection.updateOne(
        { _id: targetObjectId },
        { $set: { tier: input.tier, updatedAt: new Date() } },
      )

      try {
        await getMongoClient()
          .db()
          .collection('adminAuditLog')
          .insertOne({
            adminId: ctx.user.id,
            adminEmail: ctx.user.email,
            targetUserId: input.userId,
            targetEmail: String(targetUser.email ?? ''),
            action: 'set-tier',
            before: { tier: currentTier },
            after: { tier: input.tier },
            createdAt: new Date(),
            updatedAt: new Date(),
          })
      } catch (err) {
        console.error('[admin.setTier] Audit log write failed:', err)
      }

      return { success: true }
    }),
})

export const adminRouter = router({
  users: usersRouter,
})
