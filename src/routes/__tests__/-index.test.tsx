import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route, HomePage } from '@/routes/index'
vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ session: null }),
}))

describe('/', () => {
  describe('beforeLoad', () => {
    it('redirects authenticated users to /home', () => {
      const beforeLoad = Route.options.beforeLoad
      if (!beforeLoad) {
        throw new Error('beforeLoad is not defined')
      }

      const mockSession = { user: { id: 'u1' } }
      
      // Should throw the redirect object returned by the redirect() mock
      try {
        beforeLoad({ context: { session: mockSession } } as any)
        throw new Error('Should have thrown')
      } catch (err: any) {
        expect(err.type).toBe('redirect')
        expect(err.options.to).toBe('/home')
      }
    })

    it('does not redirect anonymous visitors', () => {
      const beforeLoad = Route.options.beforeLoad
      if (!beforeLoad) {
        return
      }

      expect(() => {
        beforeLoad({ context: { session: null } } as any)
      }).not.toThrow()
    })
  })

  describe('HomePage component', () => {
    it('does not render "Create Recipe" CTA for anonymous visitors', () => {
      render(<HomePage />)
      expect(screen.queryByRole('link', { name: /create recipe/i })).not.toBeInTheDocument()
    })

    it('does not include technology-stack marketing copy', () => {
      render(<HomePage />)
      const techCopy = /Built with TanStack Start/i
      expect(screen.queryByText(techCopy)).not.toBeInTheDocument()
    })

    it('includes a path to browse public recipes or cookbooks', () => {
      render(<HomePage />)
      const browseLink = screen.getByRole('link', { name: /browse recipes/i })
      expect(browseLink).toBeInTheDocument()
      expect(browseLink).toHaveAttribute('href', '/recipes')
    })

    it('renders "View Plans and Pricing" button for anonymous visitors', () => {
      render(<HomePage />)
      const pricingLink = screen.getByRole('link', { name: /view plans and pricing/i })
      expect(pricingLink).toBeInTheDocument()
      expect(pricingLink).toHaveAttribute('href', '/pricing')
    })

    it('pricing button uses outline style', () => {
      render(<HomePage />)
      const pricingLink = screen.getByRole('link', { name: /view plans and pricing/i })
      expect(pricingLink.className).toContain('border-2')
      expect(pricingLink.className).toContain('border-[var(--theme-accent)]')
      expect(pricingLink.className).toContain('text-[var(--theme-accent)]')
      // Should not have bg-[var(--theme-accent)] without hover prefix
      expect(pricingLink.className.split(' ')).not.toContain('bg-[var(--theme-accent)]')
    })

    it('CTA container uses responsive flex classes', () => {
      render(<HomePage />)
      const ctaContainer = screen.getByRole('link', { name: /browse recipes/i }).parentElement
      expect(ctaContainer).toHaveClass('flex-col', 'sm:flex-row')
    })

    it('does not render AdSense slots outside production for anonymous visitors', () => {
      render(<HomePage />)
      expect(screen.queryByTestId('ad-slot-top')).not.toBeInTheDocument()
      expect(screen.queryByTestId('ad-slot-bottom')).not.toBeInTheDocument()
    })
  })
})
