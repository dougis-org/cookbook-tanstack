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

  test('TC-04: selecting a non-active theme and pressing OK closes sidebar and commits theme', async ({ page }) => {
    // Default is dark; switch to light-cool via dropdown
    await page.getByLabel('Open menu').click()
    const aside = page.locator('aside')
    await expect(aside).not.toHaveClass(/-translate-x-full/)

    await page.getByTestId('theme-dropdown-trigger').click()
    await page.getByRole('option', { name: 'Light (cool)' }).click()
    await page.getByRole('button', { name: 'OK' }).click()

    await expect(aside).toHaveClass(/-translate-x-full/)
    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('light-cool')
  })

  test('TC-05: pressing Cancel on the theme dropdown closes sidebar and reverts theme', async ({ page }) => {
    // Default is dark; preview light-cool then cancel
    await page.getByLabel('Open menu').click()
    const aside = page.locator('aside')
    await expect(aside).not.toHaveClass(/-translate-x-full/)

    await page.getByTestId('theme-dropdown-trigger').click()
    await page.getByRole('option', { name: 'Light (cool)' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(aside).toHaveClass(/-translate-x-full/)
    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('dark')
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
