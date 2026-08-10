import { test, expect } from '@bgotink/playwright-coverage'
import { gotoAndWaitForHydration } from './helpers/app'

test.describe('Site-wide footer', () => {
  test('renders on an arbitrary route with copyright, Terms, and Privacy Policy links', async ({ page }) => {
    await gotoAndWaitForHydration(page, '/recipes')

    const footer = page.locator('footer.site-footer')
    await expect(footer).toBeVisible()
    await expect(footer).toContainText(`© ${new Date().getFullYear()} My CookBooks`)

    const termsLink = footer.getByRole('link', { name: 'Terms' })
    await expect(termsLink).toHaveAttribute('href', '/terms')

    const privacyLink = footer.getByRole('link', { name: 'Privacy Policy' })
    await expect(privacyLink).toHaveAttribute('href', '/privacy-policy')
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
})
