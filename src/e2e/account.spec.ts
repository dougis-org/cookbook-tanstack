import { test, expect } from '@bgotink/playwright-coverage'
import { gotoAndWaitForHydration } from './helpers/app'
import { registerAndLogin } from './helpers/auth'

test.describe('Consolidated /account page', () => {
  test('renders all three sections without clipping at mobile viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await registerAndLogin(page)

    await gotoAndWaitForHydration(page, '/account')

    // Sections are reached by scrolling, not required to fit above the fold —
    // "no clipping" means no horizontal overflow at mobile width, not that
    // every section is visible without scrolling. Scoped to #app-shell (not
    // document.documentElement) so the dev-only TanStack Devtools panel,
    // which is wider than the viewport by design, doesn't produce a false
    // positive here.
    const appShellOverflow = await page.evaluate(() => {
      const shell = document.getElementById('app-shell')
      if (!shell) throw new Error('#app-shell not found')
      return shell.scrollWidth > document.documentElement.clientWidth
    })
    expect(appShellOverflow).toBe(false)

    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Theme' })).toBeVisible()
    const saveButton = page.getByRole('button', { name: /save/i })
    await saveButton.scrollIntoViewIfNeeded()
    await expect(saveButton).toBeVisible()
  })

  test('/auth/profile redirects an authenticated visitor to /account', async ({ page }) => {
    await registerAndLogin(page)
    await gotoAndWaitForHydration(page, '/auth/profile')
    await expect(page).toHaveURL('/account')
  })

  test('/account/settings redirects an authenticated visitor to /account', async ({ page }) => {
    await registerAndLogin(page)
    await gotoAndWaitForHydration(page, '/account/settings')
    await expect(page).toHaveURL('/account')
  })
})
