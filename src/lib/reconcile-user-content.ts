import { Types, Model, ClientSession } from 'mongoose'
import { Recipe, Cookbook, Collaborator, Notification } from '@/db/models'
import { getMongoClient } from '@/db'
import { TIER_RANK, type UserTier } from '@/types/user'
import { canCreatePrivate, getRecipeLimit, getCookbookLimit } from '@/lib/tier-entitlements'

export type TierChangeDirection = 'upgrade' | 'downgrade' | 'same'

export function getTierChangeDirection(oldTier: UserTier, newTier: UserTier): TierChangeDirection {
  const oldRank = TIER_RANK[oldTier]
  const newRank = TIER_RANK[newTier]
  if (newRank > oldRank) return 'upgrade'
  if (newRank < oldRank) return 'downgrade'
  return 'same'
}

type ReconcileResult = {
  updated: number
  hidden: number
  madePublic: number
}

async function reconcileCollection(
  session: ClientSession,
  userId: string,
  direction: TierChangeDirection,
  newTier: UserTier,
  getLimit: (tier: UserTier) => number,
  Model: Model<{ userId: Types.ObjectId; isPublic: boolean; hiddenByTier?: boolean; createdAt: Date; _id: Types.ObjectId }>,
): Promise<ReconcileResult> {
  const result: ReconcileResult = { updated: 0, hidden: 0, madePublic: 0 }
  const userObjId = new Types.ObjectId(userId)

  if (direction === 'upgrade') {
    const res = await Model.updateMany(
      { userId: userObjId },
      { $set: { hiddenByTier: false } },
      { session },
    )
    result.updated = res.modifiedCount
    return result
  }

  if (direction === 'downgrade') {
    if (!canCreatePrivate(newTier)) {
      const coercionRes = await Model.updateMany(
        { userId: userObjId, isPublic: false },
        { $set: { isPublic: true } },
        { session },
      )
      result.madePublic = coercionRes.modifiedCount
    }

    const limit = getLimit(newTier)
    const visibleCount = await Model.countDocuments(
      { userId: userObjId, hiddenByTier: { $ne: true } },
      { session },
    )

    if (visibleCount > limit) {
      const toHide = await Model.find({ userId: userObjId, hiddenByTier: { $ne: true } })
        .sort({ createdAt: 1 as const })
        .skip(limit)
        .select({ _id: 1 })
        .lean()
        .session(session)

      if (toHide.length > 0) {
        const idsToHide = toHide.map((d) => d._id)
        const hideRes = await Model.updateMany(
          { _id: { $in: idsToHide } },
          { $set: { hiddenByTier: true } },
          { session },
        )
        result.hidden = hideRes.modifiedCount
      }
    }

    return result
  }

  return result
}

export type ReconcileUserContentResult = {
  recipesUpdated: number
  cookbooksUpdated: number
  recipesHidden: number
  cookbooksHidden: number
  madePublic: number
}

async function reconcileCollaborationOnDowngrade(session: ClientSession, userId: string): Promise<void> {
  const userObjId = new Types.ObjectId(userId)
  const cookbooks = await Cookbook.find({ userId: { $eq: userObjId } }, { _id: 1, name: 1 }).lean().session(session)
  if (cookbooks.length > 0) {
    const cookbookIds = cookbooks.map((cb) => cb._id)
    const cookbookMap = new Map(cookbooks.map((cb) => [cb._id.toString(), cb]))

    // Find collaborators first before deleting them
    const collaborators = await Collaborator.find({ cookbookId: { $in: cookbookIds } }).session(session)

    await Collaborator.deleteMany({ cookbookId: { $in: cookbookIds } }, { session })

    // Create a notification for each evicted collaborator explaining their access has ended
    if (collaborators.length > 0) {
      const notificationDocs = collaborators.map((c) => {
        const cbDoc = cookbookMap.get(c.cookbookId.toString())
        const cookbookTitle = cbDoc ? cbDoc.name : "a cookbook"
        return {
          userId: c.userId,
          senderId: userObjId,
          type: 'collaboration_removed',
          data: {
            cookbookId: c.cookbookId,
            cookbookTitle,
          },
          read: false,
        }
      })
      await Notification.insertMany(notificationDocs, { session })
    }
  }
}

export async function reconcileUserContent(
  userId: string,
  oldTier: UserTier,
  newTier: UserTier,
): Promise<ReconcileUserContentResult> {
  const direction = getTierChangeDirection(oldTier, newTier)

  if (direction === 'same') {
    return { recipesUpdated: 0, cookbooksUpdated: 0, recipesHidden: 0, cookbooksHidden: 0, madePublic: 0 }
  }

  const client = getMongoClient()
  const session = await client.startSession()

  try {
    let recipesUpdated = 0
    let cookbooksUpdated = 0
    let recipesHidden = 0
    let cookbooksHidden = 0
    let madePublic = 0

    await session.withTransaction(async () => {
      const rRecipes = await reconcileCollection(session, userId, direction, newTier, getRecipeLimit, Recipe)
      recipesUpdated = rRecipes.updated
      recipesHidden = rRecipes.hidden
      madePublic += rRecipes.madePublic

      const rCookbooks = await reconcileCollection(session, userId, direction, newTier, getCookbookLimit, Cookbook)
      cookbooksUpdated = rCookbooks.updated
      cookbooksHidden = rCookbooks.hidden
      madePublic += rCookbooks.madePublic

      if (direction === 'downgrade' && oldTier === 'executive-chef' && newTier !== 'executive-chef') {
        await reconcileCollaborationOnDowngrade(session, userId)
      }
    })

    return { recipesUpdated, cookbooksUpdated, recipesHidden, cookbooksHidden, madePublic }
  } finally {
    await session.endSession()
  }
}
