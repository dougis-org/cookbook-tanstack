import { test, expect } from '@bgotink/playwright-coverage'
import { gotoAndWaitForHydration } from './helpers/app'
import { registerAndLogin } from './helpers/auth'

const SUPPORTED_THEMES = ['dark', 'dark-greens', 'light-cool', 'light-warm'] as const

test.describe('Site-wide footer', () => {
  test('renders on an arbitrary route with copyright, delimiter, Terms, and Privacy Policy links', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/recipes')

    const footer = page.locator('footer.site-footer')
    await expect(footer).toBeVisible()
    await expect(footer).toContainText(`© ${new Date().getFullYear()} My CookBooks`)

    const separators = footer.locator('span[aria-hidden="true"]', { hasText: '·' })
    await expect(separators).toHaveCount(2)

    const termsLink = footer.getByRole('link', { name: 'Terms' })
    await expect(termsLink).toHaveAttribute('href', '/terms')

    const privacyLink = footer.getByRole('link', { name: 'Privacy Policy' })
    await expect(privacyLink).toHaveAttribute('href', '/privacy-policy')
  })

  test('renders on an unauthenticated auth-flow route (/auth/login)', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/auth/login')
    await expect(page.locator('footer.site-footer')).toBeVisible()
  })

  test('renders for a logged-in user', async ({ page }) => {
    await registerAndLogin(page)
    await gotoAndWaitForHydration(page, '/recipes')
    await expect(page.locator('footer.site-footer')).toBeVisible()
  })

  test('Terms link navigates client-side to /terms', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')
    await page.locator('footer.site-footer').getByRole('link', { name: 'Terms' }).click()
    await expect(page).toHaveURL(/\/terms$/)
  })

  test('Privacy Policy link navigates client-side to /privacy-policy', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/')
    await page.locator('footer.site-footer').getByRole('link', { name: 'Privacy Policy' }).click()
    await expect(page).toHaveURL(/\/privacy-policy$/)
  })

  test('is hidden under print media', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/recipes')
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('footer.site-footer')).not.toBeVisible()
  })

  for (const theme of SUPPORTED_THEMES) {
    test(`legible in the ${theme} theme (no hardcoded colors, token classes applied)`, async ({ page }) => {
      await page.addInitScript((t) => {
        localStorage.setItem('cookbook-theme', t)
      }, theme)
      await gotoAndWaitForHydration(page, '/recipes')

      const footer = page.locator('footer.site-footer')
      await expect(footer).toBeVisible()
      await expect(footer).toHaveClass(/border-\[var\(--theme-border\)\]/)
      await expect(footer).toHaveClass(/text-\[var\(--theme-fg-subtle\)\]/)

      const color = await footer.evaluate((el) => getComputedStyle(el).color)
      expect(color).not.toBe('')
      const borderColor = await footer.evaluate((el) => getComputedStyle(el).borderTopColor)
      expect(borderColor).not.toBe('')
    })
  }
})
