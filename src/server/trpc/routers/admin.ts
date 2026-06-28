import { z } from 'zod'
import { ObjectId } from 'mongodb'
import { TRPCError } from '@trpc/server'
import { adminProcedure, router } from '../init'
import { getMongoClient } from '@/db'
import { objectId } from './_helpers'
import { transformUserDoc } from './users'
import { reconcileUserContent } from '@/lib/reconcile-user-content'
import type { UserTier } from '@/types/user'
import React from 'react'
import { sendEmail } from '@/lib/mail'
import { TierNotificationEmail } from '@/emails/TierNotificationEmail'
import { TIER_DISPLAY_NAMES } from '@/lib/tier-entitlements'

const USER_TIERS = ['home-cook', 'prep-cook', 'sous-chef', 'executive-chef'] as const

const usersRouter = router({
  list: adminProcedure.query(async () => {
    const users = await getMongoClient()
      .db()
      .collection('user')
      .find({}, { projection: { email: 1, emailVerified: 1, name: 1, image: 1, tier: 1, isAdmin: 1, createdAt: 1, updatedAt: 1 } })
      .toArray()

    return users.map(transformUserDoc).filter(Boolean) as NonNullable<
      ReturnType<typeof transformUserDoc>
    >[]
  }),

  setTier: adminProcedure
    .input(
      z.object({
        userId: objectId,
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

      const targetObjectId = new ObjectId(input.userId)

      const usersCollection = getMongoClient().db().collection('user')
      const targetUser = await usersCollection.findOne({ _id: targetObjectId })

      if (!targetUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      const currentTier: UserTier = USER_TIERS.includes(targetUser.tier as UserTier)
        ? (targetUser.tier as UserTier)
        : 'home-cook'

      if (currentTier === input.tier) {
        return { success: true, noOp: true }
      }

      await usersCollection.updateOne(
        { _id: targetObjectId },
        { $set: { tier: input.tier, updatedAt: new Date() } },
      )

      const reconciliationResult = await reconcileUserContent(input.userId, currentTier, input.tier)
        .catch((err) => {
          console.error('[admin.setTier] Content reconciliation failed:', err)
          return undefined
        })
      if (reconciliationResult) {
        console.log('[admin.setTier] Reconciliation result:', reconciliationResult)
      }

      try {
        const { AdminAuditLog } = await import('@/db/models')
        await AdminAuditLog.create({
          adminId: ctx.user.id,
          adminEmail: ctx.user.email,
          targetUserId: input.userId,
          targetEmail: String(targetUser.email ?? ''),
          action: 'set-tier',
          before: { tier: currentTier },
          after: { tier: input.tier },
        })
      } catch (err) {
        console.error('[admin.setTier] Audit log write failed:', err)
      }

      // Trigger tier notification email asynchronously
      if (targetUser.email) {
        const oldIndex = USER_TIERS.indexOf(currentTier)
        const newIndex = USER_TIERS.indexOf(input.tier)
        const changeType = newIndex > oldIndex ? 'upgrade' : 'downgrade'

        void sendEmail({
          to: String(targetUser.email),
          subject: 'Your My CookBooks Tier Has Been Updated',
          text: `Your My CookBooks culinary tier has been updated to ${TIER_DISPLAY_NAMES[input.tier] || input.tier}.`,
          react: React.createElement(TierNotificationEmail, {
            tier: input.tier,
            name: targetUser.name ? String(targetUser.name) : undefined,
            changeType,
            recipesHidden: reconciliationResult?.recipesHidden,
            cookbooksHidden: reconciliationResult?.cookbooksHidden,
            madePublic: reconciliationResult?.madePublic,
          }),
        }).catch((err) => {
          console.error('[admin.setTier] Failed to send tier notification email:', err)
        })
      }

      return { success: true }
    }),
})

const auditLogRouter = router({
  list: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ input }) => {
      const { AdminAuditLog } = await import('@/db/models')

      const filter: Record<string, unknown> = {}
      if (input.userId) filter.targetUserId = input.userId
      if (input.from || input.to) {
        const createdAt: Record<string, Date> = {}
        if (input.from) createdAt.$gte = new Date(input.from)
        if (input.to) createdAt.$lte = new Date(input.to)
        filter.createdAt = createdAt
      }

      const total = await AdminAuditLog.countDocuments(filter)
      const docs = await AdminAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)

      return {
        total,
        entries: docs.map((e) => ({
          id: String(e._id),
          createdAt: e.createdAt.toISOString(),
          adminEmail: e.adminEmail,
          targetEmail: e.targetEmail,
          before: { tier: e.before.tier },
          after: { tier: e.after.tier },
        })),
      }
    }),
})

export const adminRouter = router({
  users: usersRouter,
  auditLog: auditLogRouter,
})
