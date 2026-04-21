import { test, expect } from '@bgotink/playwright-coverage'
import { registerAndLogin } from '../helpers/auth'
import { registerAndLoginAsAdmin } from '../helpers/admin'
import { gotoAndWaitForHydration } from '../helpers/app'

const ADMIN_USERS_URL = '/admin/users'
const ADMIN_TABLE_TIMEOUT_MS = 20000

test.describe('Admin users page — access control', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('unauthenticated user navigating to /admin/users is redirected to /auth/login', async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, ADMIN_USERS_URL)
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('non-admin authenticated user navigating to /admin/users is redirected to /account', async ({
    page,
  }) => {
    await registerAndLogin(page)
    await gotoAndWaitForHydration(page, ADMIN_USERS_URL)
    await expect(page).toHaveURL(/\/account/)
  })
})

test.describe('Admin users page — admin access', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('admin user can load /admin/users and see the user table', async ({ page }) => {
    await registerAndLoginAsAdmin(page)
    await gotoAndWaitForHydration(page, ADMIN_USERS_URL)
    await expect(page).toHaveURL(ADMIN_USERS_URL)
    await expect(page.getByRole('table')).toBeVisible()
    // At least one row visible (the admin themselves)
    await expect(page.locator('tbody tr').first()).toBeVisible({
      timeout: ADMIN_TABLE_TIMEOUT_MS,
    })
  })

  test('admin nav link is visible in the Header when logged in as admin', async ({ page }) => {
    await registerAndLoginAsAdmin(page)
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible()
  })

  test('admin nav link is not visible when logged in as non-admin user', async ({ page }) => {
    await registerAndLogin(page)
    await gotoAndWaitForHydration(page, '/')
    await expect(page.getByRole('link', { name: 'Admin' })).not.toBeVisible()
  })

  test('admin tier selector is disabled for own row', async ({ page }) => {
    const { email } = await registerAndLoginAsAdmin(page)
    await gotoAndWaitForHydration(page, ADMIN_USERS_URL)
    const ownSelect = page.getByLabel(`Change tier for ${email}`)
    await expect(ownSelect).toBeDisabled({ timeout: ADMIN_TABLE_TIMEOUT_MS })
  })

  test('admin can complete tier change flow: select tier → confirm modal → tier updated', async ({
    page,
  }) => {
    // Register a target user first, then register admin
    const context = page.context()
    await context.clearCookies()
    const targetUser = await registerAndLogin(page) // creates target user in DB
    await context.clearCookies()

    await registerAndLoginAsAdmin(page) // creates admin
    await gotoAndWaitForHydration(page, ADMIN_USERS_URL)

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.locator('tbody tr').first()).toBeVisible({
      timeout: ADMIN_TABLE_TIMEOUT_MS,
    })

    const targetRow = page.locator('tbody tr').filter({ hasText: targetUser.email })
    await expect(targetRow).toBeVisible({ timeout: ADMIN_TABLE_TIMEOUT_MS })
    const targetSelect = targetRow.getByLabel(`Change tier for ${targetUser.email}`)
    await expect(targetSelect).toBeEnabled()

    // Select a tier different from the current value (avoids no-op early return)
    const currentValue = await targetSelect.inputValue()
    const newTier = currentValue === 'home-cook' ? 'sous-chef' : 'home-cook'
    await targetSelect.selectOption(newTier)

    // Confirm modal should appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('dialog')).toContainText(
      newTier === 'sous-chef' ? 'Sous Chef' : 'Home Cook',
    )

    // Click Confirm
    await page.getByRole('button', { name: 'Confirm' }).click()

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(targetSelect).toHaveValue(newTier)
  })
})
