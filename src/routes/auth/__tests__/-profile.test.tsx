import { describe, it, expect } from 'vitest'

import { Route } from '@/routes/auth/profile'

describe('/auth/profile — redirect-only route', () => {
  it('redirects unauthenticated visitors to /auth/login (not /account)', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    try {
      beforeLoad({ context: { session: null }, location: { href: '/auth/profile' } } as never)
      throw new Error('Should have thrown')
    } catch (err: unknown) {
      const e = err as { type?: string; options?: { to?: string; search?: { reason?: string } } }
      expect(e.type).toBe('redirect')
      expect(e.options?.to).toBe('/auth/login')
      expect(e.options?.search).toMatchObject({ reason: 'auth-required' })
    }
  })

  it('redirects authenticated visitors to /account', () => {
    const beforeLoad = Route.options.beforeLoad
    if (!beforeLoad) throw new Error('beforeLoad not defined')
    try {
      beforeLoad({
        context: { session: { user: { id: 'u1' } } },
        location: { href: '/auth/profile' },
      } as never)
      throw new Error('Should have thrown')
    } catch (err: unknown) {
      const e = err as { type?: string; options?: { to?: string } }
      expect(e.type).toBe('redirect')
      expect(e.options?.to).toBe('/account')
    }
  })
})
