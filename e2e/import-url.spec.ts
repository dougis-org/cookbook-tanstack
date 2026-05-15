import { test, expect } from '@playwright/test'
import { seedUserWithBetterAuth } from '../src/server/trpc/routers/__tests__/test-helpers'
import { withCleanDb } from '../src/test-helpers/with-clean-db'

test.describe('URL Recipe Import', () => {
  let userId: string

  test.beforeEach(async () => {
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth({ tier: 'executive-chef' })
      userId = user.id
    })
  })

  test('imports a recipe from URL with Schema.org markup', async ({ page }) => {
    await page.goto('http://localhost:3000/import/')

    const urlInput = page.getByPlaceholderText(/paste recipe url/i)
    await expect(urlInput).toBeVisible()

    // Verify URL input is above file section
    const urlBox = await page.getByText(/import from url/i).boundingBox()
    const fileBox = await page.getByText(/import from file/i).boundingBox()
    expect(urlBox!.y).toBeLessThan(fileBox!.y)

    await urlInput.fill('https://example.com/recipe')
    await page.getByRole('button', { name: /import url/i }).click()

    // URL import bypasses the preview modal and navigates directly to the recipe
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9]{24}$/, { timeout: 10000 })
    await expect(page.locator('h1')).not.toBeEmpty()
  })

  test('file import still works (regression test)', async ({ page }) => {
    await page.goto('http://localhost:3000/import/')

    await expect(page.getByText(/drag.*file|select file/i)).toBeVisible()

    const fileContent = JSON.stringify({
      name: 'Test Recipe',
      ingredients: 'eggs, flour',
      instructions: 'Mix and bake',
      servings: 4,
    })

    await page.locator('input[type="file"]').setInputFiles({
      name: 'recipe.json',
      mimeType: 'application/json',
      buffer: Buffer.from(fileContent),
    })

    await expect(page.getByText(/import preview|recipe preview/i)).toBeVisible({ timeout: 5000 })

    await page.getByRole('button', { name: /confirm|import/i }).click()
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9]{24}$/)
  })

  test('shows error when URL import fails', async ({ page }) => {
    await page.goto('http://localhost:3000/import/')

    await page.getByPlaceholderText(/paste recipe url/i).fill('https://invalid-site-12345.com/recipe')
    await page.getByRole('button', { name: /import url/i }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=/failed|error|timed out/i')).toBeVisible()
  })

  test('rate limits URL imports', async ({ page }) => {
    await withCleanDb(async () => {
      const { urlImportRateLimiter } = await import('../src/lib/rate-limiter')
      for (let i = 0; i < 10; i++) {
        urlImportRateLimiter.record(userId)
      }
    })

    await page.goto('http://localhost:3000/import/')

    await page.getByPlaceholderText(/paste recipe url/i).fill('https://example.com/recipe')
    await page.getByRole('button', { name: /import url/i }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/exceeded.*limit|too many/i)).toBeVisible()
  })
})
