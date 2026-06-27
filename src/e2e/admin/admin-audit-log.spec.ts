import { test, expect } from '@bgotink/playwright-coverage'
import { registerAndLoginAsAdmin } from '../helpers/admin'
import { gotoAndWaitForHydration } from '../helpers/app'

const ADMIN_USERS_URL = '/admin/users'
const ADMIN_AUDIT_URL = '/admin/audit'
const TABLE_TIMEOUT_MS = 20000

test.describe('Admin audit log page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('"View audit log" link navigates to filtered audit view', async ({ page }) => {
    await registerAndLoginAsAdmin(page)
    await gotoAndWaitForHydration(page, ADMIN_USERS_URL)

    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: TABLE_TIMEOUT_MS })

    const firstAuditLink = page.getByRole('link', { name: 'View audit log' }).first()
    await expect(firstAuditLink).toBeVisible()

    const href = await firstAuditLink.getAttribute('href')
    expect(href).toContain('/admin/audit')
    expect(href).toContain('userId=')

    await firstAuditLink.click()
    await expect(page).toHaveURL(/\/admin\/audit\?userId=/)
    // Table is always present (empty state appears inside tbody)
    await expect(page.locator('table')).toBeVisible({ timeout: TABLE_TIMEOUT_MS })
  })

  test('"Audit Log" nav link is active on /admin/audit', async ({ page }) => {
    await registerAndLoginAsAdmin(page)
    await gotoAndWaitForHydration(page, ADMIN_AUDIT_URL)

    const auditNavLink = page.getByRole('link', { name: 'Audit Log', exact: true })
    await expect(auditNavLink).toBeVisible()
    await expect(auditNavLink).toHaveClass(/font-medium/)

    const usersNavLink = page.getByRole('link', { name: 'Users' })
    await expect(usersNavLink).not.toHaveClass(/font-medium/)
  })

  test('navigating to /admin/audit without filter shows all entries or empty state', async ({ page }) => {
    await registerAndLoginAsAdmin(page)
    await gotoAndWaitForHydration(page, ADMIN_AUDIT_URL)

    await expect(page).toHaveURL(/\/admin\/audit/)
    // Table is always rendered (empty state appears inside table tbody)
    await expect(page.locator('table')).toBeVisible({ timeout: TABLE_TIMEOUT_MS })
  })

  test('"Audit Log" nav link navigates from /admin/users to /admin/audit', async ({ page }) => {
    await registerAndLoginAsAdmin(page)
    await gotoAndWaitForHydration(page, ADMIN_USERS_URL)

    await page.getByRole('link', { name: 'Audit Log', exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/audit/)
  })
})
