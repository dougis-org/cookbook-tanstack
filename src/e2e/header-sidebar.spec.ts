import { test, expect } from '@bgotink/playwright-coverage'
import { gotoAndWaitForHydration } from './helpers/app'

test.describe('Header sidebar close behaviors', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
    await page.addInitScript(() => {
      localStorage.removeItem('cookbook-theme')
    })
    await gotoAndWaitForHydration(page, '/')
  })

  // ── AC1: Click outside (backdrop) closes sidebar ───────────────────────

  test('TC-01: clicking the backdrop closes the sidebar', async ({ page }) => {
    await page.getByLabel('Open menu').click()
    const aside = page.locator('aside')
    await expect(aside).not.toHaveClass(/-translate-x-full/)

    const backdrop = page.locator('div[aria-hidden="true"].fixed.inset-0')
    await expect(backdrop).toBeVisible()
    await backdrop.click()

    await expect(aside).toHaveClass(/-translate-x-full/)
  })

  test('TC-02: backdrop does not exist when sidebar is closed', async ({ page }) => {
    const backdrop = page.locator('div[aria-hidden="true"].fixed.inset-0')
    await expect(backdrop).not.toBeAttached()
  })

  test('TC-03: clicking inside the sidebar does not close it', async ({ page }) => {
    await page.getByLabel('Open menu').click()
    const aside = page.locator('aside')
    await expect(aside).not.toHaveClass(/-translate-x-full/)

    // Click the sidebar title text — inside the drawer
    await page.locator('aside h2').click()

    await expect(aside).not.toHaveClass(/-translate-x-full/)
  })

  // ── AC2: Selecting a theme closes sidebar ─────────────────────────────

  test('TC-04: clicking a non-active theme button closes sidebar and updates theme', async ({ page }) => {
    // Default is dark; switch to light
    await page.getByLabel('Open menu').click()
    const aside = page.locator('aside')
    await expect(aside).not.toHaveClass(/-translate-x-full/)

    await page.getByRole('button', { name: 'Light' }).click()

    await expect(aside).toHaveClass(/-translate-x-full/)
    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('light')
  })

  test('TC-05: clicking the already-active theme button still closes sidebar', async ({ page }) => {
    // Default is dark; click Dark (already active)
    await page.getByLabel('Open menu').click()
    const aside = page.locator('aside')
    await expect(aside).not.toHaveClass(/-translate-x-full/)

    await page.getByRole('button', { name: 'Dark' }).click()

    await expect(aside).toHaveClass(/-translate-x-full/)
  })

  // ── AC3: Existing close behaviors (regression guard) ──────────────────

  test('TC-06: X button closes sidebar', async ({ page }) => {
    await page.getByLabel('Open menu').click()
    const aside = page.locator('aside')
    await expect(aside).not.toHaveClass(/-translate-x-full/)

    await page.getByLabel('Close menu').click()

    await expect(aside).toHaveClass(/-translate-x-full/)
  })

  test('TC-07: clicking a nav link closes sidebar', async ({ page }) => {
    await page.getByLabel('Open menu').click()
    const aside = page.locator('aside')
    await expect(aside).not.toHaveClass(/-translate-x-full/)

    await aside.getByRole('link', { name: 'Recipes' }).click()

    await expect(aside).toHaveClass(/-translate-x-full/)
  })
})
