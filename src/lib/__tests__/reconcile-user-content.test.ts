// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { Types } from 'mongoose'
import { withCleanDb } from '@/test-helpers/with-clean-db'
import { Recipe, Cookbook } from '@/db/models'
import { seedUserWithBetterAuth } from '@/server/trpc/routers/__tests__/test-helpers'
import { reconcileUserContent, getTierChangeDirection } from '@/lib/reconcile-user-content'

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))

const BASE = new Date('2024-01-01T00:00:00Z')

function doc(userId: Types.ObjectId, isPublic = true, hiddenByTier = false, tsOffset = 0) {
  const createdAt = new Date(BASE.getTime() + tsOffset * 1000)
  return {
    userId,
    name: 'Test Doc',
    isPublic,
    hiddenByTier,
    mealIds: [],
    courseIds: [],
    preparationIds: [],
    recipes: [],
    createdAt,
    updatedAt: createdAt,
  }
}

function makeRecipe(userId: Types.ObjectId, overrides: Record<string, unknown> = {}) {
  return { ...doc(userId), ...overrides }
}

function makeCookbook(userId: Types.ObjectId, overrides: Record<string, unknown> = {}) {
  return { ...doc(userId), ...overrides }
}

async function insertRecipes(userId: string, count: number, isPublic = true, startOffset = 0) {
  for (let i = 0; i < count; i++) {
    await Recipe.collection.insertOne(makeRecipe(new Types.ObjectId(userId), {
      createdAt: new Date(BASE.getTime() + (startOffset + i) * 1000),
      isPublic,
    }))
  }
}

async function insertCookbooks(userId: string, count: number, isPublic = true, startOffset = 0) {
  for (let i = 0; i < count; i++) {
    await Cookbook.collection.insertOne(makeCookbook(new Types.ObjectId(userId), {
      createdAt: new Date(BASE.getTime() + (startOffset + i) * 1000),
      isPublic,
    }))
  }
}

async function asrtVisible(userId: string) {
  const docs = await Recipe.find({ userId: new Types.ObjectId(userId) })
  docs.forEach((d) => expect(d.hiddenByTier).toBe(false))
}

async function asrtPublic(userId: string) {
  const docs = await Recipe.find({ userId: new Types.ObjectId(userId) })
  docs.forEach((d) => expect(d.isPublic).toBe(true))
}

async function asrtVisibleHidden(userId: string, visible: number, hidden: number) {
  const all = await Recipe.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: 1 })
  expect(all.filter((d) => !d.hiddenByTier)).toHaveLength(visible)
  expect(all.filter((d) => d.hiddenByTier)).toHaveLength(hidden)
}

async function asrtCookbooksVisibleHidden(userId: string, visible: number, hidden: number) {
  const uid = new Types.ObjectId(userId)
  expect(await Cookbook.find({ userId: uid, hiddenByTier: { $ne: true } })).toHaveLength(visible)
  expect(await Cookbook.find({ userId: uid, hiddenByTier: true })).toHaveLength(hidden)
}

// ─── getTierChangeDirection ─────────────────────────────────────────────────

describe('getTierChangeDirection', () => {
  it('returns upgrade when newTier rank > oldTier rank', () => {
    expect(getTierChangeDirection('sous-chef', 'executive-chef')).toBe('upgrade')
    expect(getTierChangeDirection('home-cook', 'prep-cook')).toBe('upgrade')
  })

  it('returns downgrade when newTier rank < oldTier rank', () => {
    expect(getTierChangeDirection('executive-chef', 'sous-chef')).toBe('downgrade')
    expect(getTierChangeDirection('prep-cook', 'home-cook')).toBe('downgrade')
  })

  it('returns same when tiers are equal', () => {
    expect(getTierChangeDirection('sous-chef', 'sous-chef')).toBe('same')
    expect(getTierChangeDirection('home-cook', 'home-cook')).toBe('same')
  })
})

// ─── upgrade ────────────────────────────────────────────────────────────────

describe('reconcileUserContent upgrade', () => {
  it('Test 1a — all docs get hiddenByTier: false', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const uid = new Types.ObjectId(user.id as string)
      await Recipe.collection.insertOne(makeRecipe(uid, { hiddenByTier: false }))
      await Recipe.collection.insertOne(makeRecipe(uid, { hiddenByTier: true }))
      await Recipe.collection.insertOne(makeRecipe(uid, { hiddenByTier: false }))
      await Cookbook.collection.insertOne(makeCookbook(uid, { hiddenByTier: true }))
      await Cookbook.collection.insertOne(makeCookbook(uid, { hiddenByTier: false }))
      const result = await reconcileUserContent(user.id as string, 'sous-chef', 'executive-chef')
      expect(result.recipesUpdated).toBe(3)
      expect(result.cookbooksUpdated).toBe(2)
      expect(result.recipesHidden).toBe(0)
      expect(result.cookbooksHidden).toBe(0)
      expect(result.madePublic).toBe(0)
      await asrtVisible(user.id as string)
      const cbks = await Cookbook.find({ userId: uid })
      cbks.forEach((c) => expect(c.hiddenByTier).toBe(false))
    })
  })

  it('Test 1b — zero content returns all zeros', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const result = await reconcileUserContent(user.id as string, 'home-cook', 'prep-cook')
      expect(result).toEqual({ recipesUpdated: 0, cookbooksUpdated: 0, recipesHidden: 0, cookbooksHidden: 0, madePublic: 0 })
    })
  })
})

// ─── downgrade coercion ────────────────────────────────────────────────────

describe('reconcileUserContent downgrade coercion', () => {
  it('Test 1c — sous-chef → prep-cook makes private docs public', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const uid = new Types.ObjectId(user.id as string)
      await Recipe.collection.insertOne(makeRecipe(uid, { isPublic: false }))
      await Recipe.collection.insertOne(makeRecipe(uid, { isPublic: false }))
      await Cookbook.collection.insertOne(makeCookbook(uid, { isPublic: false }))
      const result = await reconcileUserContent(user.id as string, 'sous-chef', 'prep-cook')
      expect(result.madePublic).toBe(3)
      expect(result.recipesHidden).toBe(0)
      expect(result.cookbooksHidden).toBe(0)
      await asrtPublic(user.id as string)
      const cbks = await Cookbook.find({ userId: uid })
      cbks.forEach((c) => expect(c.isPublic).toBe(true))
    })
  })

  it('Test 1d — downgrade between public-only tiers coerces private', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const uid = new Types.ObjectId(user.id as string)
      await Recipe.collection.insertOne(makeRecipe(uid, { isPublic: false }))
      const result = await reconcileUserContent(user.id as string, 'prep-cook', 'home-cook')
      expect(result.madePublic).toBe(1)
      await asrtPublic(user.id as string)
    })
  })

  it('Test 1e — zero private content returns madePublic: 0', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const uid = new Types.ObjectId(user.id as string)
      await Recipe.collection.insertOne(makeRecipe(uid, { isPublic: true }))
      await Cookbook.collection.insertOne(makeCookbook(uid, { isPublic: true }))
      const result = await reconcileUserContent(user.id as string, 'sous-chef', 'prep-cook')
      expect(result.madePublic).toBe(0)
    })
  })
})

// ─── downgrade limit enforcement ───────────────────────────────────────────

describe('reconcileUserContent downgrade limit', () => {
  it('Test 1f — 15 recipes, limit 10 hides oldest 5', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      await insertRecipes(user.id as string, 15)
      const result = await reconcileUserContent(user.id as string, 'sous-chef', 'home-cook')
      expect(result.recipesHidden).toBe(5)
      await asrtVisibleHidden(user.id as string, 10, 5)
    })
  })

  it('Test 1g — exactly 100 recipes, limit 100 returns recipesHidden: 0', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      await insertRecipes(user.id as string, 100)
      const result = await reconcileUserContent(user.id as string, 'sous-chef', 'prep-cook')
      expect(result.recipesHidden).toBe(0)
      await asrtVisible(user.id as string)
    })
  })

  it('Test 1h — recipes and cookbooks get limited separately', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const userId = user.id as string
      await insertRecipes(userId, 600)
      await insertCookbooks(userId, 30)
      const result = await reconcileUserContent(userId, 'sous-chef', 'prep-cook')
      expect(result.recipesHidden).toBe(500)
      expect(result.cookbooksHidden).toBe(20)
      const visibleRecipes = await Recipe.find({ userId: new Types.ObjectId(userId), hiddenByTier: { $ne: true } }).lean()
      const hiddenRecipes = await Recipe.find({ userId: new Types.ObjectId(userId), hiddenByTier: true }).lean()
      expect(visibleRecipes).toHaveLength(100)
      expect(hiddenRecipes).toHaveLength(500)
      await asrtCookbooksVisibleHidden(userId, 10, 20)
    })
  })
})

// ─── combined downgrade ────────────────────────────────────────────────────

describe('reconcileUserContent combined downgrade', () => {
  it('Test 1i — coercion + limit together', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      await insertRecipes(user.id as string, 15, false)
      const result = await reconcileUserContent(user.id as string, 'sous-chef', 'home-cook')
      expect(result.madePublic).toBe(15)
      expect(result.recipesHidden).toBe(5)
      await asrtPublic(user.id as string)
      await asrtVisibleHidden(user.id as string, 10, 5)
    })
  })
})

// ─── idempotent re-run ─────────────────────────────────────────────────────

describe('reconcileUserContent idempotent re-run', () => {
  it('Test 1l — second call returns zeros', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      await insertRecipes(user.id as string, 15)
      await reconcileUserContent(user.id as string, 'sous-chef', 'home-cook')
      const result = await reconcileUserContent(user.id as string, 'sous-chef', 'home-cook')
      expect(result).toEqual({ recipesUpdated: 0, cookbooksUpdated: 0, recipesHidden: 0, cookbooksHidden: 0, madePublic: 0 })
    })
  })
})
