// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { Types } from 'mongoose'
import { withCleanDb } from '@/test-helpers/with-clean-db'
import { Recipe, Cookbook } from '@/db/models'
import { seedUserWithBetterAuth } from '@/server/trpc/routers/__tests__/test-helpers'
import { reconcileUserContent, getTierChangeDirection } from '@/lib/reconcile-user-content'

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))

function makeRecipe(userId: string | Types.ObjectId, overrides: Record<string, unknown> = {}) {
  return {
    userId: typeof userId === 'string' ? new Types.ObjectId(userId) : userId,
    name: 'Test Recipe',
    isPublic: true,
    hiddenByTier: false,
    mealIds: [],
    courseIds: [],
    preparationIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeCookbook(userId: string | Types.ObjectId, overrides: Record<string, unknown> = {}) {
  return {
    userId: typeof userId === 'string' ? new Types.ObjectId(userId) : userId,
    name: 'Test Cookbook',
    isPublic: true,
    hiddenByTier: false,
    recipes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

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

describe('reconcileUserContent', () => {
  describe('upgrade', () => {
    it('Test 1a — Upgrade: all docs get hiddenByTier: false', async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth()
        const userId = user.id as string

        await Recipe.collection.insertOne(makeRecipe(userId, { hiddenByTier: false }))
        await Recipe.collection.insertOne(makeRecipe(userId, { hiddenByTier: true }))
        await Recipe.collection.insertOne(makeRecipe(userId, { hiddenByTier: false }))
        await Cookbook.collection.insertOne(makeCookbook(userId, { hiddenByTier: true }))
        await Cookbook.collection.insertOne(makeCookbook(userId, { hiddenByTier: false }))

        const result = await reconcileUserContent(userId, 'sous-chef', 'executive-chef')

        expect(result.recipesUpdated).toBe(3)
        expect(result.cookbooksUpdated).toBe(2)
        expect(result.recipesHidden).toBe(0)
        expect(result.cookbooksHidden).toBe(0)
        expect(result.madePublic).toBe(0)

        const recipes = await Recipe.find({ userId: new Types.ObjectId(userId) })
        for (const r of recipes) {
          expect(r.hiddenByTier).toBe(false)
        }
        const cookbooks = await Cookbook.find({ userId: new Types.ObjectId(userId) })
        for (const c of cookbooks) {
          expect(c.hiddenByTier).toBe(false)
        }
      })
    })

    it('Test 1b — Upgrade with zero content returns zeros', async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth()
        const result = await reconcileUserContent(user.id as string, 'home-cook', 'prep-cook')
        expect(result).toEqual({
          recipesUpdated: 0,
          cookbooksUpdated: 0,
          recipesHidden: 0,
          cookbooksHidden: 0,
          madePublic: 0,
        })
      })
    })
  })

  describe('downgrade coercion', () => {
    it('Test 1c — Downgrade coercion: sous-chef → prep-cook makes private docs public', async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth()
        const userId = user.id as string

        await Recipe.collection.insertOne(makeRecipe(userId, { isPublic: false }))
        await Recipe.collection.insertOne(makeRecipe(userId, { isPublic: false }))
        await Cookbook.collection.insertOne(makeCookbook(userId, { isPublic: false }))

        const result = await reconcileUserContent(userId, 'sous-chef', 'prep-cook')

        expect(result.madePublic).toBe(3)
        expect(result.recipesHidden).toBe(0)
        expect(result.cookbooksHidden).toBe(0)

        const recipes = await Recipe.find({ userId: new Types.ObjectId(userId) })
        for (const r of recipes) {
          expect(r.isPublic).toBe(true)
        }
        const cookbooks = await Cookbook.find({ userId: new Types.ObjectId(userId) })
        for (const c of cookbooks) {
          expect(c.isPublic).toBe(true)
        }
      })
    })

    it('Test 1d — Downgrade coercion between public-only tiers', async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth()
        const userId = user.id as string

        await Recipe.collection.insertOne(makeRecipe(userId, { isPublic: false }))

        const result = await reconcileUserContent(userId, 'prep-cook', 'home-cook')

        expect(result.madePublic).toBe(1)

        const recipes = await Recipe.find({ userId: new Types.ObjectId(userId) })
        for (const r of recipes) {
          expect(r.isPublic).toBe(true)
        }
      })
    })

    it('Test 1e — Downgrade coercion with zero private content returns madePublic: 0', async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth()
        const userId = user.id as string

        await Recipe.collection.insertOne(makeRecipe(userId, { isPublic: true }))
        await Cookbook.collection.insertOne(makeCookbook(userId, { isPublic: true }))

        const result = await reconcileUserContent(userId, 'sous-chef', 'prep-cook')
        expect(result.madePublic).toBe(0)
      })
    })
  })

  describe('downgrade limit enforcement', () => {
    it('Test 1f — Downgrade limit: 15 recipes, limit 10 hides oldest excess', async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth()
        const userId = user.id as string

        const baseDate = new Date('2024-01-01T00:00:00Z')
        for (let i = 0; i < 15; i++) {
          const createdAt = new Date(baseDate.getTime() + i * 1000)
          await Recipe.collection.insertOne(makeRecipe(userId, { createdAt, isPublic: true }))
        }

        const result = await reconcileUserContent(userId, 'sous-chef', 'home-cook')

        expect(result.recipesHidden).toBe(5)

        const allRecipes = await Recipe.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: 1 })
        const visible = allRecipes.filter((r) => !r.hiddenByTier)
        const hidden = allRecipes.filter((r) => r.hiddenByTier)

        expect(visible).toHaveLength(10)
        expect(hidden).toHaveLength(5)
        expect(visible[0].createdAt.getTime()).toBe(allRecipes[0].createdAt.getTime())
        expect(hidden[0].createdAt.getTime()).toBe(allRecipes[10].createdAt.getTime())
      })
    })

    it('Test 1g — Downgrade at boundary: exactly 100 recipes, limit 100 returns recipesHidden: 0', async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth()
        const userId = user.id as string

        const baseDate = new Date('2024-01-01T00:00:00Z')
        for (let i = 0; i < 100; i++) {
          const createdAt = new Date(baseDate.getTime() + i * 1000)
          await Recipe.collection.insertOne(makeRecipe(userId, { createdAt, isPublic: true }))
        }

        const result = await reconcileUserContent(userId, 'sous-chef', 'prep-cook')
        expect(result.recipesHidden).toBe(0)

        const allRecipes = await Recipe.find({ userId: new Types.ObjectId(userId) })
        for (const r of allRecipes) {
          expect(r.hiddenByTier).toBe(false)
        }
      })
    })

    it('Test 1h — Downgrade limits separately for recipes and cookbooks', async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth()
        const userId = user.id as string

        const baseDate = new Date('2024-01-01T00:00:00Z')
        for (let i = 0; i < 600; i++) {
          const createdAt = new Date(baseDate.getTime() + i * 1000)
          await Recipe.collection.insertOne(makeRecipe(userId, { createdAt, isPublic: true }))
        }
        for (let i = 0; i < 30; i++) {
          const createdAt = new Date(baseDate.getTime() + i * 1000)
          await Cookbook.collection.insertOne(makeCookbook(userId, { createdAt, isPublic: true }))
        }

        const result = await reconcileUserContent(userId, 'sous-chef', 'prep-cook')

        expect(result.recipesHidden).toBe(500)
        expect(result.cookbooksHidden).toBe(20)

        const visibleRecipes = await Recipe.find({ userId: new Types.ObjectId(userId), hiddenByTier: { $ne: true } })
        const hiddenRecipes = await Recipe.find({ userId: new Types.ObjectId(userId), hiddenByTier: true })
        expect(visibleRecipes).toHaveLength(100)
        expect(hiddenRecipes).toHaveLength(500)

        const visibleCookbooks = await Cookbook.find({ userId: new Types.ObjectId(userId), hiddenByTier: { $ne: true } })
        const hiddenCookbooks = await Cookbook.find({ userId: new Types.ObjectId(userId), hiddenByTier: true })
        expect(visibleCookbooks).toHaveLength(10)
        expect(hiddenCookbooks).toHaveLength(20)
      })
    })
  })

  describe('combined downgrade', () => {
    it('Test 1i — Combined downgrade: coercion + limit together', async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth()
        const userId = user.id as string

        const baseDate = new Date('2024-01-01T00:00:00Z')
        for (let i = 0; i < 15; i++) {
          const createdAt = new Date(baseDate.getTime() + i * 1000)
          await Recipe.collection.insertOne(makeRecipe(userId, { createdAt, isPublic: false }))
        }

        const result = await reconcileUserContent(userId, 'sous-chef', 'home-cook')

        expect(result.madePublic).toBe(15)
        expect(result.recipesHidden).toBe(5)

        const allRecipes = await Recipe.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: 1 })
        for (const r of allRecipes) {
          expect(r.isPublic).toBe(true)
        }
        const visible = allRecipes.filter((r) => !r.hiddenByTier)
        const hidden = allRecipes.filter((r) => r.hiddenByTier)
        expect(visible).toHaveLength(10)
        expect(hidden).toHaveLength(5)
      })
    })
  })

  describe('idempotent re-run', () => {
    it('Test 1l — Idempotent re-run returns zeros on second call', async () => {
      await withCleanDb(async () => {
        const user = await seedUserWithBetterAuth()
        const userId = user.id as string

        const baseDate = new Date('2024-01-01T00:00:00Z')
        for (let i = 0; i < 15; i++) {
          const createdAt = new Date(baseDate.getTime() + i * 1000)
          await Recipe.collection.insertOne(makeRecipe(userId, { createdAt, isPublic: true }))
        }

        await reconcileUserContent(userId, 'sous-chef', 'home-cook')
        const result = await reconcileUserContent(userId, 'sous-chef', 'home-cook')

        expect(result.recipesUpdated).toBe(0)
        expect(result.cookbooksUpdated).toBe(0)
        expect(result.recipesHidden).toBe(0)
        expect(result.cookbooksHidden).toBe(0)
        expect(result.madePublic).toBe(0)
      })
    })
  })
})
