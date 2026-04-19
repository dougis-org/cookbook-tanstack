import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
// We will create home.tsx next, exporting Route and HomePageComponent
import { Route, HomePageComponent } from '../home'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: any) => ({
    options: opts,
    useParams: () => ({}),
    useSearch: () => ({}),
  }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  redirect: (opts: any) => {
    const err = new Error('Redirect')
    ;(err as any).options = opts
    throw err
  },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isLoggedIn: true, session: { user: { id: 'u1' } } }),
}))

describe('/home', () => {
  describe('beforeLoad', () => {
    it('redirects anonymous visitors (auth guard)', () => {
      const beforeLoad = Route.options.beforeLoad
      if (!beforeLoad) {
        throw new Error('beforeLoad is not defined')
      }
      
      expect(() => {
        beforeLoad({ context: { session: null }, location: { href: '/home' } } as any)
      }).toThrow('Redirect')
    })

    it('allows authenticated users', () => {
      const beforeLoad = Route.options.beforeLoad
      if (!beforeLoad) {
        return
      }

      expect(() => {
        beforeLoad({ context: { session: { user: { id: 'u1' } } }, location: { href: '/home' } } as any)
      }).not.toThrow()
    })
  })

  describe('HomePageComponent', () => {
    it('renders workflow shortcuts', () => {
      render(<HomePageComponent />)
      expect(screen.getByRole('link', { name: /create recipe/i })).toBeInTheDocument()
    })

    it('renders global discovery links', () => {
      render(<HomePageComponent />)
      expect(screen.getByRole('link', { name: /all recipes/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /cookbooks/i })).toBeInTheDocument()
    })

    it('does not render ad slots on authenticated home', () => {
      render(<HomePageComponent />)
      expect(screen.queryByTestId('ad-slot-top')).not.toBeInTheDocument()
      expect(screen.queryByTestId('ad-slot-bottom')).not.toBeInTheDocument()
    })
  })
})
