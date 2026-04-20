import { MongoClient } from 'mongodb'
import type { Page } from '@playwright/test'
import { registerAndLogin } from './auth'
import { gotoAndWaitForHydration } from './app'

/**
 * Register a user, set isAdmin via direct MongoDB update, and re-login to
 * refresh the session so the session carries isAdmin: true.
 */
export async function registerAndLoginAsAdmin(page: Page) {
  const creds = await registerAndLogin(page)

  // Set isAdmin directly via the MongoDB driver using MONGODB_URI.
  // This works in all environments (local dev, CI) without Docker exec.
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/cookbook'
  const client = new MongoClient(mongoUri)
  try {
    await client.connect()
    await client.db().collection('user').updateOne(
      { email: creds.email },
      { $set: { isAdmin: true } },
    )
  } finally {
    await client.close()
  }

  // Clear the signup session before re-login so the refreshed session cookie
  // carries isAdmin: true and is the only auth cookie sent by the browser.
  await page.context().clearCookies()

  const origin = process.env.BETTER_AUTH_URL
    ? new URL(process.env.BETTER_AUTH_URL).origin
    : new URL(page.url()).origin

  const response = await page.request.post('/api/auth/sign-in/email', {
    data: { email: creds.email, password: creds.password },
    headers: { Origin: origin },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Admin re-login failed: ${response.status()} ${body}`)
  }

  await gotoAndWaitForHydration(page, '/')

  return creds
}
