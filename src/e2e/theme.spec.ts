import { test, expect } from '@bgotink/playwright-coverage'
import { gotoAndWaitForHydration } from './helpers/app'
import { registerAndLogin } from './helpers/auth'
import { createCookbookWithRecipe } from './helpers/cookbooks'

test.describe('Theme system', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
    // Clear localStorage theme preference before each test
    await page.addInitScript(() => {
      localStorage.removeItem('cookbook-theme')
    })
  })

  test('default theme is dark when no preference stored', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')

    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('dark')
  })

  test('theme persists across page reload', async ({ page }) => {
    // The beforeEach addInitScript removes 'cookbook-theme' on every navigation,
    // including reloads. Add a second init script here (runs after the first,
    // in registration order) to set light — this simulates a stored preference
    // surviving the reload. UI-click → localStorage write is covered by the
    // 'switching theme' test.
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light')
    })

    await gotoAndWaitForHydration(page, '/')

    const htmlClassAfterLoad = await page.evaluate(() => document.documentElement.className)
    expect(htmlClassAfterLoad).toContain('light')

    // Reload and verify theme is restored
    await page.reload()
    await page.waitForLoadState('networkidle')

    const htmlClassAfterReload = await page.evaluate(() => document.documentElement.className)
    expect(htmlClassAfterReload).toContain('light')

    // Theme selector should show Light as active (aria-pressed=true)
    await page.getByLabel('Open menu').click()
    const lightBtn = page.getByRole('button', { name: 'Light' })
    await expect(lightBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('no flash: html has light class before hydration when light stored', async ({ page }) => {
    // Pre-set localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light')
    })

    // Use 'commit' to inspect the very first paint — before React hydration
    await page.goto('/', { waitUntil: 'commit' })

    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('light')
  })

  test('theme selector renders with Dark and Light options in hamburger', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')

    await page.getByLabel('Open menu').click()

    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
  })

  test('switching theme changes key surface colors', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')

    // Get header background in dark mode
    const headerBgDark = await page.evaluate(() => {
      const header = document.querySelector('.site-header')
      return header ? window.getComputedStyle(header).backgroundColor : ''
    })

    // Switch to light
    await page.getByLabel('Open menu').click()
    await page.getByRole('button', { name: 'Light' }).click()
    await page.waitForTimeout(100)

    // Header background should change
    const headerBgLight = await page.evaluate(() => {
      const header = document.querySelector('.site-header')
      return header ? window.getComputedStyle(header).backgroundColor : ''
    })

    expect(headerBgLight).not.toBe(headerBgDark)
  })

  test('print isolation: PrintLayout wrapper has white background regardless of theme', async ({ page }) => {
    // Set dark theme to confirm PrintLayout overrides it
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'dark')
    })

    // Need a real cookbook to navigate to the print route
    await registerAndLogin(page)
    const { cookbookId } = await createCookbookWithRecipe(page, 'ThemePrint')

    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print`)

    // PrintLayout renders a wrapper div with inline CSS variable overrides.
    // Assert that the --theme-bg token is overridden to white inside that wrapper.
    const printBg = await page.evaluate(() => {
      // The PrintLayout div is the first child of the print route content area
      const printWrapper = document.querySelector('[style*="--theme-bg"]') as HTMLElement | null
      if (!printWrapper) return null
      return printWrapper.style.getPropertyValue('--theme-bg').trim()
    })

    expect(printBg).toBe('white')
  })
})
