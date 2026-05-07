import { test, expect } from '@playwright/test'
import { seedUserWithBetterAuth } from '../src/server/trpc/routers/__tests__/test-helpers'
import { withCleanDb } from '../src/test-helpers/with-clean-db'

test.describe('URL Recipe Import', () => {
  test('imports a recipe from URL with Schema.org markup', async ({ page, context }) => {
    let userId: string
    let sessionCookie: string

    // Set up database and authentication
    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth({
        tier: 'executive-chef',
      })
      userId = user.id

      // Set up authentication cookie
      // (This is simplified; in real tests you'd use Better Auth's login flow)
      sessionCookie = `userId=${userId}`
    })

    // Navigate to import page
    await page.goto('http://localhost:3000/import/')

    // Verify URL input is visible
    const urlInput = page.getByPlaceholderText(/paste recipe url/i)
    await expect(urlInput).toBeVisible()

    // Verify URL input is above file section
    const fileSection = page.getByText(/import from file/i)
    const urlSection = page.getByText(/import from url/i)

    const urlBox = await urlSection.boundingBox()
    const fileBox = await fileSection.boundingBox()

    expect(urlBox!.y).toBeLessThan(fileBox!.y)

    // Paste a test URL (would be mocked in real test)
    await urlInput.fill('https://example.com/recipe')

    // Click import button
    const importButton = page.getByRole('button', { name: /import url/i })
    await importButton.click()

    // URL import bypasses the preview modal and navigates directly to the recipe
    // Wait for navigation to recipe page
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9]{24}$/, { timeout: 10000 })

    // Verify recipe is displayed
    const pageTitle = page.locator('h1')
    await expect(pageTitle).not.toBeEmpty()
  })

  test('file import still works (regression test)', async ({ page }) => {
    let userId: string

    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth({
        tier: 'executive-chef',
      })
      userId = user.id
    })

    // Navigate to import page
    await page.goto('http://localhost:3000/import/')

    // Verify file dropzone is visible
    const dropzone = page.getByText(/drag.*file|select file/i)
    await expect(dropzone).toBeVisible()

    // Create a mock recipe JSON file
    const fileContent = JSON.stringify({
      name: 'Test Recipe',
      ingredients: 'eggs, flour',
      instructions: 'Mix and bake',
      servings: 4,
    })

    const buffer = Buffer.from(fileContent)
    const blob = new (page.context() as any).File(
      [buffer],
      'recipe.json',
      { type: 'application/json' }
    )

    // Upload file
    await page.locator('input[type="file"]').setInputFiles({
      name: 'recipe.json',
      mimeType: 'application/json',
      buffer: buffer,
    })

    // Wait for preview modal
    await expect(page.getByText(/import preview|recipe preview/i)).toBeVisible({
      timeout: 5000,
    })

    // Click confirm
    const confirmButton = page.getByRole('button', { name: /confirm|import/i })
    await confirmButton.click()

    // Verify redirect
    await expect(page).toHaveURL(/\/recipes\/[a-f0-9]{24}$/)
  })

  test('shows error when URL import fails', async ({ page }) => {
    let userId: string

    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth({
        tier: 'executive-chef',
      })
      userId = user.id
    })

    await page.goto('http://localhost:3000/import/')

    const urlInput = page.getByPlaceholderText(/paste recipe url/i)

    // Try an invalid URL
    await urlInput.fill('https://invalid-site-12345.com/recipe')

    const importButton = page.getByRole('button', { name: /import url/i })
    await importButton.click()

    // Wait for error message
    await expect(page.getByRole('alert')).toBeVisible({
      timeout: 5000,
    })

    // Verify error text is shown
    const errorText = page.locator('text=/failed|error|timed out/i')
    await expect(errorText).toBeVisible()
  })

  test('rate limits URL imports', async ({ page }) => {
    let userId: string

    await withCleanDb(async () => {
      const user = await seedUserWithBetterAuth({
        tier: 'executive-chef',
      })
      userId = user.id

      // Pre-fill rate limiter to 10 uses
      const { urlImportRateLimiter } = await import(
        '../src/lib/rate-limiter'
      )
      for (let i = 0; i < 10; i++) {
        urlImportRateLimiter.record(userId)
      }
    })

    await page.goto('http://localhost:3000/import/')

    const urlInput = page.getByPlaceholderText(/paste recipe url/i)
    await urlInput.fill('https://example.com/recipe')

    const importButton = page.getByRole('button', { name: /import url/i })
    await importButton.click()

    // Should see rate limit error
    await expect(page.getByRole('alert')).toBeVisible({
      timeout: 5000,
    })

    await expect(
      page.getByText(/exceeded.*limit|too many/i)
    ).toBeVisible()
  })
})
