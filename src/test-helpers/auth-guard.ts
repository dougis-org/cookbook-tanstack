import { expect } from 'vitest'
import type { redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/types/router'

export function expectRedirect(
  guard: (args: { context: RouterContext; location: { href: string } }) => void,
  context: RouterContext,
  location: { href: string },
  expectedTo: string,
  expectedSearch?: Record<string, unknown>,
) {
  let thrown: unknown
  try {
    guard({ context, location } as never)
  } catch (e) {
    thrown = e
  }

  if (!thrown) {
    throw new Error('Guard did not throw a redirect')
  }

  const r = thrown as ReturnType<typeof redirect>
  expect(r.type).toBe('redirect')
  expect(r.options.to).toBe(expectedTo)
  if (expectedSearch) {
    expect(r.options.search).toMatchObject(expectedSearch)
  }
}

export function testVerifiedAuthGuard(
  beforeLoad: (args: { context: RouterContext; location: { href: string } }) => void,
  href: string,
) {
  expectRedirect(
    beforeLoad,
    { session: null } as never,
    { href },
    '/auth/login',
    { reason: 'auth-required', from: href },
  )

  expectRedirect(
    beforeLoad,
    { session: { user: { id: 'u1', emailVerified: false } } } as never,
    { href },
    '/auth/verify-email',
    { from: href },
  )

  expect(() =>
    beforeLoad({
      context: { session: { user: { id: 'u1', emailVerified: true } } } as never,
      location: { href },
    }),
  ).not.toThrow()
}
