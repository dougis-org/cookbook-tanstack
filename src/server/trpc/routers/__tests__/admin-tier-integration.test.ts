// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { Types } from 'mongoose'
import { withCleanDb } from '@/test-helpers/with-clean-db'
import { Recipe } from '@/db/models'
import { seedUserWithBetterAuth, makeAuthCaller } from './test-helpers'

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))

async function makeAdminCaller(userId: string) {
  return makeAuthCaller(userId, { email: 'admin@test.com', isAdmin: true })
}

async function seedUserWithHigherTier(tier: 'sous-chef' | 'executive-chef') {
  const user = await seedUserWithBetterAuth()
  const userObjId = new Types.ObjectId(user.id)
  const { getMongoClient } = await import('@/db')
  await getMongoClient().db().collection('user').updateOne(
    { _id: userObjId },
    { $set: { tier } },
  )
  return user
}

describe('admin.users.setTier — full reconciliation integration', () => {
  it('downgrade to home-cook hides over-limit recipes from list', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithHigherTier('sous-chef')
      const adminCaller = await makeAdminCaller(new Types.ObjectId().toHexString())

      const base = new Date('2024-01-01T00:00:00Z')
      for (let i = 0; i < 15; i++) {
        await Recipe.collection.insertOne({
          userId: new Types.ObjectId(user.id),
          name: `Recipe ${i}`,
          isPublic: true,
          hiddenByTier: false,
          mealIds: [],
          courseIds: [],
          preparationIds: [],
          createdAt: new Date(base.getTime() + i * 1000),
          updatedAt: new Date(base.getTime() + i * 1000),
        })
      }

      await adminCaller.admin.users.setTier({ userId: user.id, tier: 'home-cook' })

      const caller = await makeAuthCaller(user.id)
      const result = await caller.recipes.list({ userId: user.id })
      expect(result.items).toHaveLength(10)
    })
  })

  it('upgrade to executive-chef restores all hidden recipes in list', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithHigherTier('sous-chef')
      const adminCaller = await makeAdminCaller(new Types.ObjectId().toHexString())

      const base = new Date('2024-01-01T00:00:00Z')
      for (let i = 0; i < 15; i++) {
        await Recipe.collection.insertOne({
          userId: new Types.ObjectId(user.id),
          name: `Recipe ${i}`,
          isPublic: true,
          hiddenByTier: false,
          mealIds: [],
          courseIds: [],
          preparationIds: [],
          createdAt: new Date(base.getTime() + i * 1000),
          updatedAt: new Date(base.getTime() + i * 1000),
        })
      }

      await adminCaller.admin.users.setTier({ userId: user.id, tier: 'home-cook' })
      const caller = await makeAuthCaller(user.id)
      expect((await caller.recipes.list({ userId: user.id })).items).toHaveLength(10)

      await adminCaller.admin.users.setTier({ userId: user.id, tier: 'executive-chef' })
      const result = await caller.recipes.list({ userId: user.id })
      expect(result.items).toHaveLength(15)
    })
  })

  it('after downgrade, the 5 newest recipes have hiddenByTier: true in the DB', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithHigherTier('sous-chef')
      const adminCaller = await makeAdminCaller(new Types.ObjectId().toHexString())

      const base = new Date('2024-01-01T00:00:00Z')
      for (let i = 0; i < 15; i++) {
        await Recipe.collection.insertOne({
          userId: new Types.ObjectId(user.id),
          name: `Recipe ${i}`,
          isPublic: true,
          hiddenByTier: false,
          mealIds: [],
          courseIds: [],
          preparationIds: [],
          createdAt: new Date(base.getTime() + i * 1000),
          updatedAt: new Date(base.getTime() + i * 1000),
        })
      }

      await adminCaller.admin.users.setTier({ userId: user.id, tier: 'home-cook' })

      const userObjId = new Types.ObjectId(user.id)
      const hiddenRecipes = await Recipe.find({
        userId: userObjId,
        hiddenByTier: true,
      }).lean()

      expect(hiddenRecipes).toHaveLength(5)
      const recipe9Timestamp = new Date(base.getTime() + 9 * 1000)
      for (const r of hiddenRecipes) {
        const createdAt = (r as { createdAt: Date }).createdAt
        expect(createdAt.getTime()).toBeGreaterThan(recipe9Timestamp.getTime())
      }
    })
  })
})