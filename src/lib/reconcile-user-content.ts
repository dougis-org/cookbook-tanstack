import { Types, Model, ClientSession } from 'mongoose'
import { Recipe, Cookbook } from '@/db/models'
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
    const visibleCount = await Model.countDocuments({
      userId: userObjId,
      hiddenByTier: { $ne: true },
    })

    if (visibleCount > limit) {
      const toHide = await Model.find({ userId: userObjId, hiddenByTier: { $ne: true } })
        .sort({ createdAt: 1 as const })
        .skip(limit)
        .select({ _id: 1 })
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
      const r = await reconcileCollection(session, userId, direction, newTier, getRecipeLimit, Recipe)
      recipesUpdated = r.updated
      recipesHidden = r.hidden
      madePublic += r.madePublic
    })

    await session.withTransaction(async () => {
      const r = await reconcileCollection(session, userId, direction, newTier, getCookbookLimit, Cookbook)
      cookbooksUpdated = r.updated
      cookbooksHidden = r.hidden
      madePublic += r.madePublic
    })

    return { recipesUpdated, cookbooksUpdated, recipesHidden, cookbooksHidden, madePublic }
  } finally {
    await session.endSession()
  }
}
