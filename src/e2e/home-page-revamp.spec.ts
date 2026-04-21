import { test, expect } from '@bgotink/playwright-coverage'

test.describe('Home Page Revamp', () => {
  test('anonymous visitor sees public landing page on /', async ({ page }) => {
    await page.goto('/')
    
    // Should stay on /
    await expect(page).toHaveURL('/')
    
    // Should see CookBook title in the main section (more specific selector)
    await expect(page.locator('section h1')).toContainText('CookBook')
    
    // Should NOT see Create Recipe CTA
    await expect(page.getByRole('link', { name: 'Create Recipe', exact: true })).not.toBeVisible()
    
    // Should see Browse Recipes
    await expect(page.getByRole('link', { name: 'Browse Recipes' })).toBeVisible()
    
    // AdSense surfaces stay suppressed in non-production environments
    await expect(page.getByTestId('ad-slot-top')).toHaveCount(0)
    await expect(page.getByTestId('ad-slot-bottom')).toHaveCount(0)
  })

  test('anonymous visitor navigating to /home is redirected to login', async ({ page }) => {
    // Navigating directly to /home should trigger the beforeLoad guard
    await page.goto('/home')
    
    // Should be redirected to /auth/login
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
