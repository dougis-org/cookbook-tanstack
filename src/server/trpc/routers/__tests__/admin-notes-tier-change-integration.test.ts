// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { Types } from 'mongoose'
import { withCleanDb } from '@/test-helpers/with-clean-db'
import { Recipe, RecipeNote } from '@/db/models'
import { getMongoClient } from '@/db'
import { seedUserWithBetterAuth, makeAuthCaller } from './test-helpers'
import type { UserTier } from '@/types/user'

async function seedUserWithTier(tier: UserTier) {
  const user = await seedUserWithBetterAuth()
  await getMongoClient().db().collection('user').updateOne(
    { _id: new Types.ObjectId(user.id) },
    { $set: { tier } },
  )
  return user
}

function makeAdminCaller() {
  const adminId = new Types.ObjectId().toHexString()
  return makeAuthCaller(adminId, { email: 'admin@test.com', isAdmin: true })
}

async function assertDbTier(userId: string, expectedTier: UserTier) {
  const dbUser = await getMongoClient().db().collection('user').findOne({ _id: new Types.ObjectId(userId) })
  expect(dbUser?.tier).toBe(expectedTier)
}

describe('admin.users.setTier — notes tier visibility', () => {
  it('downgrade: note content withheld immediately on next request', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithTier('sous-chef')
      const recipe = await Recipe.create({ name: 'R', userId: new Types.ObjectId(user.id), isPublic: true })
      const recipeId = recipe._id.toHexString()

      const sousChefCaller = await makeAuthCaller(user.id, { tier: 'sous-chef' })
      await sousChefCaller.privateRecipeNotes.upsert({ recipeId, body: 'Secret note' })

      const adminCaller = await makeAdminCaller()
      await adminCaller.admin.users.setTier({ userId: user.id, tier: 'home-cook' })
      await assertDbTier(user.id, 'home-cook')

      const homeCookCaller = await makeAuthCaller(user.id, { tier: 'home-cook' })
      const result = await homeCookCaller.privateRecipeNotes.get({ recipeId })
      expect(result).toEqual({ hasNote: true, note: null })
    })
  })

  it('re-upgrade: original note body restored intact', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithTier('sous-chef')
      const recipe = await Recipe.create({ name: 'R', userId: new Types.ObjectId(user.id), isPublic: true })
      const recipeId = recipe._id.toHexString()

      const sousChefCaller = await makeAuthCaller(user.id, { tier: 'sous-chef' })
      await sousChefCaller.privateRecipeNotes.upsert({ recipeId, body: 'Original body' })

      const adminCaller = await makeAdminCaller()
      await adminCaller.admin.users.setTier({ userId: user.id, tier: 'home-cook' })
      await assertDbTier(user.id, 'home-cook')
      await adminCaller.admin.users.setTier({ userId: user.id, tier: 'sous-chef' })
      await assertDbTier(user.id, 'sous-chef')

      const restoredCaller = await makeAuthCaller(user.id, { tier: 'sous-chef' })
      const result = await restoredCaller.privateRecipeNotes.get({ recipeId })
      expect(result.hasNote).toBe(true)
      expect(result.note).not.toBeNull()
      expect(result.note?.body).toBe('Original body')
      expect(result.note?.updatedAt).toBeInstanceOf(Date)
    })
  })

  it('upgrade from zero: newly-entitled user with no notes gets { hasNote: false, note: null }', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithTier('prep-cook')
      const recipe = await Recipe.create({ name: 'R', userId: new Types.ObjectId(user.id), isPublic: true })
      const recipeId = recipe._id.toHexString()

      const adminCaller = await makeAdminCaller()
      await adminCaller.admin.users.setTier({ userId: user.id, tier: 'executive-chef' })
      await assertDbTier(user.id, 'executive-chef')

      const execChefCaller = await makeAuthCaller(user.id, { tier: 'executive-chef' })
      const result = await execChefCaller.privateRecipeNotes.get({ recipeId })
      expect(result).toEqual({ hasNote: false, note: null })
    })
  })

  it('idempotent downgrade: RecipeNote document is unchanged after tier change', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithTier('sous-chef')
      const recipe = await Recipe.create({ name: 'R', userId: new Types.ObjectId(user.id), isPublic: true })
      const recipeId = recipe._id.toHexString()

      const sousChefCaller = await makeAuthCaller(user.id, { tier: 'sous-chef' })
      await sousChefCaller.privateRecipeNotes.upsert({ recipeId, body: 'Test body' })

      const userObjId = new Types.ObjectId(user.id)
      const noteBefore = await RecipeNote.findOne({ userId: userObjId, recipeId: recipe._id }).lean()
      expect(noteBefore).not.toBeNull()

      const adminCaller = await makeAdminCaller()
      await adminCaller.admin.users.setTier({ userId: user.id, tier: 'home-cook' })
      await assertDbTier(user.id, 'home-cook')
      await adminCaller.admin.users.setTier({ userId: user.id, tier: 'home-cook' })
      await assertDbTier(user.id, 'home-cook')

      const noteAfter = await RecipeNote.findOne({ userId: userObjId, recipeId: recipe._id }).lean()
      expect(noteAfter).toEqual(noteBefore)
    })
  })
})
