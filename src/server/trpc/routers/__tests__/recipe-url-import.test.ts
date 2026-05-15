// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Types } from 'mongoose'
import { TRPCError } from '@trpc/server'
import { withCleanDb } from '@/test-helpers/with-clean-db'
import { seedUserWithBetterAuth, makeAuthCaller, makeTieredCaller } from './test-helpers'

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))
vi.mock('@/lib/recipe-url-import', () => ({
  fetchAndNormalizeRecipe: vi.fn(),
  validateImportUrl: vi.fn(),
}))
vi.mock('@/lib/ai-extractor', () => ({
  createAnthropicExtractor: vi.fn(() => ({ extract: vi.fn() })),
}))

const { fetchAndNormalizeRecipe } = await import('@/lib/recipe-url-import')
const mockFetchAndNormalize = vi.mocked(fetchAndNormalizeRecipe)

const EXEC_TIER = 'executive-chef'
const NON_IMPORT_TIER = 'home-cook'

const PARSED_RECIPE = {
  name: 'Pasta Carbonara',
  ingredients: 'eggs, bacon',
  instructions: 'Mix and cook',
  isPublic: true,
  mealIds: [],
  courseIds: [],
  preparationIds: [],
}

describe('recipes.importFromUrl', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockFetchAndNormalize.mockResolvedValue(PARSED_RECIPE)
    const { urlImportRateLimiter } = await import('@/lib/rate-limiter')
    urlImportRateLimiter.reset()
  })

  it('throws PAYMENT_REQUIRED when user tier cannot import', async () => {
    await withCleanDb(async () => {
      const caller = await makeTieredCaller(NON_IMPORT_TIER)
      await expect(
        caller.recipes.importFromUrl({ url: 'https://example.com/recipe' })
      ).rejects.toMatchObject({ code: 'PAYMENT_REQUIRED' })
    })
  })

  it('throws UNAUTHORIZED when user is not authenticated', async () => {
    const { appRouter } = await import('@/server/trpc/router')
    const caller = appRouter.createCaller({ session: null, user: null })
    await expect(
      caller.recipes.importFromUrl({ url: 'https://example.com/recipe' })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('throws TOO_MANY_REQUESTS when rate limit exceeded', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: EXEC_TIER })

      const { urlImportRateLimiter } = await import('@/lib/rate-limiter')
      for (let i = 0; i < 10; i++) {
        urlImportRateLimiter.record(user.id)
      }

      await expect(
        caller.recipes.importFromUrl({ url: 'https://example.com/recipe' })
      ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' })
    })
  })

  it('creates a recipe and returns its id on success', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: EXEC_TIER })

      const result = await caller.recipes.importFromUrl({
        url: 'https://example.com/recipe',
      })

      expect(result).toHaveProperty('id')
      expect(typeof result.id).toBe('string')
    })
  })

  it('propagates TRPCError from fetchAndNormalizeRecipe', async () => {
    mockFetchAndNormalize.mockRejectedValue(
      new TRPCError({ code: 'BAD_REQUEST', message: 'URL not allowed' })
    )

    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { tier: EXEC_TIER })

      await expect(
        caller.recipes.importFromUrl({ url: 'https://example.com/recipe' })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'URL not allowed' })
    })
  })

  it('admin bypasses tier check', async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth()
      const caller = await makeAuthCaller(user.id, { isAdmin: true })

      const result = await caller.recipes.importFromUrl({
        url: 'https://example.com/recipe',
      })

      expect(result).toHaveProperty('id')
    })
  })
})
