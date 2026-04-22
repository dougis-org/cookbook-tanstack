import { MongoClient } from 'mongodb'
import type { Page } from '@playwright/test'
import { registerAndLogin } from './auth'
import { gotoAndWaitForHydration } from './app'

async function patchUserAndRelogin(page: Page, email: string, password: string, patch: Record<string, unknown>) {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/cookbook'
  const client = new MongoClient(mongoUri)
  try {
    await client.connect()
    await client.db().collection('user').updateOne({ email }, { $set: patch })
  } finally {
    await client.close()
  }

  await page.context().clearCookies()

  const origin = process.env.BETTER_AUTH_URL
    ? new URL(process.env.BETTER_AUTH_URL).origin
    : new URL(page.url()).origin

  const response = await page.request.post('/api/auth/sign-in/email', {
    data: { email, password },
    headers: { Origin: origin },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Re-login failed: ${response.status()} ${body}`)
  }

  await gotoAndWaitForHydration(page, '/')
}

export async function registerAndLoginAsAdmin(page: Page) {
  const creds = await registerAndLogin(page)
  await patchUserAndRelogin(page, creds.email, creds.password, { isAdmin: true })
  return creds
}

export async function registerAndLoginWithTier(page: Page, tier: string) {
  const creds = await registerAndLogin(page)
  await patchUserAndRelogin(page, creds.email, creds.password, { tier })
  return creds
}
