import { test, expect } from '@bgotink/playwright-coverage'
import type { Page } from '@playwright/test'
import { gotoAndWaitForHydration } from './helpers/app'
import { registerAndLogin } from './helpers/auth'
import { createCookbookWithRecipe } from './helpers/cookbooks'

// Helper: open sidebar, open the theme dropdown, select an option, optionally commit
async function selectThemeViaDropdown(
  page: Page,
  themeLabel: string,
  { commit = true, sidebarAlreadyOpen = false } = {}
) {
  if (!sidebarAlreadyOpen) {
    await page.getByLabel('Open menu').click()
  }
  await page.getByTestId('theme-dropdown-trigger').click()
  await page.getByRole('option', { name: themeLabel }).click()
  if (commit) {
    await page.getByRole('button', { name: 'OK' }).click()
  }
}

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
    // in registration order) to set light-cool — this simulates a stored preference
    // surviving the reload. UI-click → localStorage write is covered by the
    // 'switching theme' test.
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light-cool')
    })

    await gotoAndWaitForHydration(page, '/')

    const htmlClassAfterLoad = await page.evaluate(() => document.documentElement.className)
    expect(htmlClassAfterLoad).toContain('light-cool')

    // Reload and verify theme is restored
    await page.reload()
    await page.waitForLoadState('networkidle')

    const htmlClassAfterReload = await page.evaluate(() => document.documentElement.className)
    expect(htmlClassAfterReload).toContain('light-cool')

    // Theme dropdown trigger should show Light (cool) as the committed theme
    await page.getByLabel('Open menu').click()
    const trigger = page.getByTestId('theme-dropdown-trigger')
    await expect(trigger).toContainText('Light (cool)')
    // Open dropdown and verify the option is selected
    await trigger.click()
    const lightCoolOption = page.getByRole('option', { name: 'Light (cool)' })
    await expect(lightCoolOption).toHaveAttribute('aria-selected', 'true')
  })

  test('no flash: html has light-cool class before hydration when light-cool stored', async ({ page }) => {
    // Pre-set localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light-cool')
    })

    // Use 'commit' to inspect the very first paint — before React hydration
    await page.goto('/', { waitUntil: 'commit' })

    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('light-cool')
  })

  test('migration shim: stored "light" is migrated to "light-cool" on page load', async ({ page }) => {
    // Pre-set legacy 'light' value to simulate a user who had the old theme stored
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light')
    })

    await page.goto('/', { waitUntil: 'commit' })

    // Should have migrated to light-cool
    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toBe('light-cool')

    // localStorage should be updated
    const storedTheme = await page.evaluate(() => localStorage.getItem('cookbook-theme'))
    expect(storedTheme).toBe('light-cool')
  })

  // T4a: open sidebar, open dropdown — assert all 3 theme options visible
  test('T4a: theme dropdown shows all registered theme options', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')

    await page.getByLabel('Open menu').click()
    await page.getByTestId('theme-dropdown-trigger').click()

    await expect(page.getByRole('option', { name: 'Dark' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Light (cool)' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Light (warm)' })).toBeVisible()
  })

  // T4b: select light-warm — assert html class changes before OK pressed
  test('T4b: selecting an option previews the theme before OK', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')

    await page.getByLabel('Open menu').click()
    await page.getByTestId('theme-dropdown-trigger').click()
    // Click option but don't commit
    await page.getByRole('option', { name: 'Light (warm)' }).click()

    // HTML class should already be light-warm (live preview)
    await expect(page.locator('html')).toHaveClass(/light-warm/)
  })

  // T4c: press OK — assert theme committed after sidebar close
  test('T4c: pressing OK commits the theme and closes sidebar', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')

    await selectThemeViaDropdown(page, 'Light (warm)', { commit: true })

    // HTML class should still be light-warm after sidebar closes
    await expect(page.locator('html')).toHaveClass(/light-warm/)

    // localStorage should reflect the committed theme
    const storedTheme = await page.evaluate(() => localStorage.getItem('cookbook-theme'))
    expect(storedTheme).toBe('light-warm')

    // Re-open sidebar — trigger should show the committed theme
    await page.getByLabel('Open menu').click()
    await expect(page.getByTestId('theme-dropdown-trigger')).toContainText('Light (warm)')
  })

  // T4d: select light-cool, press Cancel — assert html class reverts
  test('T4d: pressing Cancel reverts preview and closes sidebar', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')

    // Start in dark theme, preview light-cool, then cancel
    await page.getByLabel('Open menu').click()
    await page.getByTestId('theme-dropdown-trigger').click()
    await page.getByRole('option', { name: 'Light (cool)' }).click()
    // Verify preview is active
    await expect(page.locator('html')).toHaveClass(/light-cool/)

    await page.getByRole('button', { name: 'Cancel' }).click()

    // Should revert to dark
    await expect(page.locator('html')).toHaveClass(/dark/)
    // Sidebar should be closed
    await expect(page.getByLabel('Open menu')).toBeVisible()
  })

  // T4e: Escape key — assert dropdown closes and class reverts
  test('T4e: pressing Escape while preview active closes dropdown and reverts class', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')

    await page.getByLabel('Open menu').click()
    await page.getByTestId('theme-dropdown-trigger').click()
    await page.getByRole('option', { name: 'Light (warm)' }).click()
    await expect(page.locator('html')).toHaveClass(/light-warm/)

    // Press Escape
    await page.keyboard.press('Escape')

    // Class should revert to dark
    await expect(page.locator('html')).toHaveClass(/dark/)
    // Dropdown panel should be gone
    await expect(page.getByRole('listbox')).not.toBeVisible()
  })

  // T4f: click outside — assert dropdown closes and class reverts
  test('T4f: clicking outside dropdown reverts preview and closes panel', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')

    await page.getByLabel('Open menu').click()
    await page.getByTestId('theme-dropdown-trigger').click()
    await page.getByRole('option', { name: 'Light (cool)' }).click()
    await expect(page.locator('html')).toHaveClass(/light-cool/)

    // Click outside the dropdown (on the sidebar nav area)
    await page.locator('aside nav').click()

    // Class should revert
    await expect(page.locator('html')).toHaveClass(/dark/)
    // Dropdown panel should be gone
    await expect(page.getByRole('listbox')).not.toBeVisible()
  })

  test('switching to Light (warm) changes key surface colors', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')

    const headerBgDark = await page.evaluate(() => {
      const header = document.querySelector('.site-header')
      return header ? window.getComputedStyle(header).backgroundColor : ''
    })

    // Use the dropdown to select and commit light-warm
    await selectThemeViaDropdown(page, 'Light (warm)', { commit: true })
    await expect(page.locator('html')).toHaveClass(/light-warm/)

    const headerBgWarm = await page.evaluate(() => {
      const header = document.querySelector('.site-header')
      return header ? window.getComputedStyle(header).backgroundColor : ''
    })

    expect(headerBgWarm).not.toBe(headerBgDark)
  })

  test('light-warm: active filter chip text matches the theme accent', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light-warm')
    })

    await gotoAndWaitForHydration(page, '/recipes?hasImage=true')

    const hasImageBtn = page.getByRole('button', { name: 'Has Image', exact: true })
    await expect(hasImageBtn).toBeVisible()

    const colors = await hasImageBtn.evaluate((el) => {
      const buttonColor = window.getComputedStyle(el).color
      const accentColor = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-accent')
        .trim()

      const swatch = document.createElement('div')
      swatch.style.color = accentColor
      document.body.appendChild(swatch)
      const resolvedAccent = window.getComputedStyle(swatch).color
      swatch.remove()

      return { buttonColor, resolvedAccent }
    })

    expect(colors.buttonColor).toBe(colors.resolvedAccent)
  })

  test('Light (warm) theme persists across page reload', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light-warm')
    })

    await gotoAndWaitForHydration(page, '/')

    const htmlClassAfterLoad = await page.evaluate(() => document.documentElement.className)
    expect(htmlClassAfterLoad).toContain('light-warm')

    await page.reload()
    await page.waitForLoadState('networkidle')

    const htmlClassAfterReload = await page.evaluate(() => document.documentElement.className)
    expect(htmlClassAfterReload).toContain('light-warm')

    // Trigger should show Light (warm) as committed theme
    await page.getByLabel('Open menu').click()
    await expect(page.getByTestId('theme-dropdown-trigger')).toContainText('Light (warm)')
    // Open dropdown and verify option is selected
    await page.getByTestId('theme-dropdown-trigger').click()
    await expect(page.getByRole('option', { name: 'Light (warm)' })).toHaveAttribute('aria-selected', 'true')
  })

  test('no flash: html has light-warm class before hydration when light-warm stored', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light-warm')
    })

    await page.goto('/', { waitUntil: 'commit' })

    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('light-warm')
  })

  test('switching theme changes key surface colors', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')

    // Get header background in dark mode
    const headerBgDark = await page.evaluate(() => {
      const header = document.querySelector('.site-header')
      return header ? window.getComputedStyle(header).backgroundColor : ''
    })

    // Switch to light-cool using the dropdown
    await selectThemeViaDropdown(page, 'Light (cool)', { commit: true })
    await page.waitForTimeout(100)

    // Header background should change
    const headerBgLight = await page.evaluate(() => {
      const header = document.querySelector('.site-header')
      return header ? window.getComputedStyle(header).backgroundColor : ''
    })

    expect(headerBgLight).not.toBe(headerBgDark)
  })

  test('light-cool: active filter chip text matches the theme accent', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light-cool')
    })

    await gotoAndWaitForHydration(page, '/recipes?hasImage=true')

    const hasImageBtn = page.getByRole('button', { name: 'Has Image', exact: true })
    await expect(hasImageBtn).toBeVisible()

    const colors = await hasImageBtn.evaluate((el) => {
      const buttonColor = window.getComputedStyle(el).color
      const accentColor = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-accent')
        .trim()

      const swatch = document.createElement('div')
      swatch.style.color = accentColor
      document.body.appendChild(swatch)
      const resolvedAccent = window.getComputedStyle(swatch).color
      swatch.remove()

      return { buttonColor, resolvedAccent }
    })

    expect(colors.buttonColor).toBe(colors.resolvedAccent)
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
