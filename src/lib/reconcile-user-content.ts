import mongoose, { Types } from 'mongoose'
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

type RecipeReconcileResult = { recipesUpdated: number; recipesHidden: number; madePublic: number }
type CookbookReconcileResult = { cookbooksUpdated: number; cookbooksHidden: number; madePublic: number }

async function reconcileRecipes(
  session: mongoose.ClientSession,
  userId: string,
  direction: TierChangeDirection,
  newTier: UserTier,
): Promise<RecipeReconcileResult> {
  const result: RecipeReconcileResult = { recipesUpdated: 0, recipesHidden: 0, madePublic: 0 }
  const userObjId = new Types.ObjectId(userId)

  if (direction === 'upgrade') {
    const res = await Recipe.updateMany(
      { userId: userObjId },
      { $set: { hiddenByTier: false } },
      { session },
    )
    result.recipesUpdated = res.modifiedCount
    return result
  }

  if (direction === 'downgrade') {
    if (!canCreatePrivate(newTier)) {
      const coercionRes = await Recipe.updateMany(
        { userId: userObjId, isPublic: false },
        { $set: { isPublic: true } },
        { session },
      )
      result.madePublic = coercionRes.modifiedCount
    }

    const limit = getRecipeLimit(newTier)
    const visibleCount = await Recipe.countDocuments({
      userId: userObjId,
      hiddenByTier: { $ne: true },
    })

    if (visibleCount > limit) {
      const toHide = await Recipe.find({ userId: userObjId, hiddenByTier: { $ne: true } })
        .sort({ createdAt: 1 as const })
        .skip(limit)
        .select({ _id: 1 })
        .session(session)

      if (toHide.length > 0) {
        const idsToHide = toHide.map((r) => r._id)
        const hideRes = await Recipe.updateMany(
          { _id: { $in: idsToHide } },
          { $set: { hiddenByTier: true } },
          { session },
        )
        result.recipesHidden = hideRes.modifiedCount
      } else {
        result.recipesHidden = 0
      }
    }

    return result
  }

  return result
}

async function reconcileCookbooks(
  session: mongoose.ClientSession,
  userId: string,
  direction: TierChangeDirection,
  newTier: UserTier,
): Promise<CookbookReconcileResult> {
  const result: CookbookReconcileResult = { cookbooksUpdated: 0, cookbooksHidden: 0, madePublic: 0 }
  const userObjId = new Types.ObjectId(userId)

  if (direction === 'upgrade') {
    const res = await Cookbook.updateMany(
      { userId: userObjId },
      { $set: { hiddenByTier: false } },
      { session },
    )
    result.cookbooksUpdated = res.modifiedCount
    return result
  }

  if (direction === 'downgrade') {
    if (!canCreatePrivate(newTier)) {
      const coercionRes = await Cookbook.updateMany(
        { userId: userObjId, isPublic: false },
        { $set: { isPublic: true } },
        { session },
      )
      result.madePublic = coercionRes.modifiedCount
    }

    const limit = getCookbookLimit(newTier)
    const visibleCount = await Cookbook.countDocuments({
      userId: userObjId,
      hiddenByTier: { $ne: true },
    })

    if (visibleCount > limit) {
      const toHide = await Cookbook.find({ userId: userObjId, hiddenByTier: { $ne: true } })
        .sort({ createdAt: 1 as const })
        .skip(limit)
        .select({ _id: 1 })
        .session(session)

      if (toHide.length > 0) {
        const idsToHide = toHide.map((c) => c._id)
        const hideRes = await Cookbook.updateMany(
          { _id: { $in: idsToHide } },
          { $set: { hiddenByTier: true } },
          { session },
        )
        result.cookbooksHidden = hideRes.modifiedCount
      } else {
        result.cookbooksHidden = 0
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
      const recipeResult = await reconcileRecipes(session, userId, direction, newTier)
      recipesUpdated = recipeResult.recipesUpdated
      recipesHidden = recipeResult.recipesHidden
      madePublic += recipeResult.madePublic
    })

    await session.withTransaction(async () => {
      const cookbookResult = await reconcileCookbooks(session, userId, direction, newTier)
      cookbooksUpdated = cookbookResult.cookbooksUpdated
      cookbooksHidden = cookbookResult.cookbooksHidden
      madePublic += cookbookResult.madePublic
    })

    return { recipesUpdated, cookbooksUpdated, recipesHidden, cookbooksHidden, madePublic }
  } finally {
    await session.endSession()
  }
}
