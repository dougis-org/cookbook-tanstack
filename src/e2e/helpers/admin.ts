import { execFileSync } from 'child_process'
import type { Page } from '@playwright/test'
import { registerAndLogin } from './auth'
import { gotoAndWaitForHydration } from './app'

/**
 * Register a user, set isAdmin via direct MongoDB update, and re-login to
 * refresh the session so the session carries isAdmin: true.
 */
export async function registerAndLoginAsAdmin(page: Page) {
  const creds = await registerAndLogin(page)

  // Set isAdmin on the user directly in MongoDB using execFileSync (no shell)
  const mongoScript = [
    `db = db.getSiblingDB('cookbook');`,
    `db.user.updateOne({ email: '${creds.email}' }, { $set: { isAdmin: true } });`,
  ].join(' ')

  execFileSync('docker', [
    'exec',
    'cookbook-mongodb',
    'mongosh',
    '--quiet',
    '--eval',
    mongoScript,
  ])

  // Re-login to refresh session cookie so it carries isAdmin: true
  const origin = process.env.BETTER_AUTH_URL
    ? new URL(process.env.BETTER_AUTH_URL).origin
    : new URL(page.url()).origin

  await page.request.post('/api/auth/sign-in/email', {
    data: { email: creds.email, password: creds.password },
    headers: { Origin: origin },
  })

  await gotoAndWaitForHydration(page, '/')

  return creds
}
