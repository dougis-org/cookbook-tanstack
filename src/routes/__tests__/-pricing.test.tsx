import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TIER_LIMITS } from '@/lib/tier-entitlements'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

// Mock PageLayout to render children, and AdSlot to render with testid (bypasses PROD-only guard)
vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AdSlot: ({ position }: { position: string }) => (
    <div data-testid={`ad-slot-${position}`} />
  ),
}))

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

import { PricingPage } from '@/routes/pricing'

function anonSession() {
  return { session: null }
}

function tierSession(tier: string) {
  return { session: { user: { id: 'u1', tier, isAdmin: false } } }
}

describe('/pricing', () => {
  describe('tier table', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(anonSession())
    })

    it('renders all 5 tier names', () => {
      render(<PricingPage />)
      expect(screen.getByText('Anonymous')).toBeInTheDocument()
      expect(screen.getByText('Home Cook')).toBeInTheDocument()
      expect(screen.getByText('Prep Cook')).toBeInTheDocument()
      expect(screen.getByText('Sous Chef')).toBeInTheDocument()
      expect(screen.getByText('Executive Chef')).toBeInTheDocument()
    })

    it('shows correct recipe limits from TIER_LIMITS per tier card', () => {
      render(<PricingPage />)
      const tiers = ['home-cook', 'prep-cook', 'sous-chef', 'executive-chef'] as const
      for (const tier of tiers) {
        const card = screen.getByTestId(`tier-card-${tier}`)
        const expected = String(TIER_LIMITS[tier].recipes)
        expect(card.textContent).toContain(expected)
      }
    })

    it('shows correct cookbook limits from TIER_LIMITS per tier card', () => {
      render(<PricingPage />)
      const tiers = ['home-cook', 'prep-cook', 'sous-chef', 'executive-chef'] as const
      for (const tier of tiers) {
        const card = screen.getByTestId(`tier-card-${tier}`)
        const expected = String(TIER_LIMITS[tier].cookbooks)
        expect(card.textContent).toContain(expected)
      }
    })

    it('renders non-empty tier descriptions for each tier', () => {
      render(<PricingPage />)
      // descriptions render as text — verify at least one description-like text is present
      const descriptions = screen.getAllByTestId('tier-description')
      expect(descriptions.length).toBe(5)
      descriptions.forEach((el) => {
        expect(el.textContent!.length).toBeGreaterThan(0)
      })
    })
  })

  describe('tier highlight', () => {
    it('highlights sous-chef card when session tier is sous-chef', () => {
      mockUseAuth.mockReturnValue(tierSession('sous-chef'))
      render(<PricingPage />)
      expect(screen.getByTestId('tier-card-sous-chef')).toHaveAttribute('data-current', 'true')
    })

    it('does not highlight any card for anonymous session', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const cards = screen.getAllByTestId(/^tier-card-/)
      cards.forEach((card) => {
        expect(card).not.toHaveAttribute('data-current', 'true')
      })
    })

    it('does not crash when session.user.tier is undefined', () => {
      mockUseAuth.mockReturnValue({ session: { user: { id: 'u1', isAdmin: false } } })
      expect(() => render(<PricingPage />)).not.toThrow()
      const cards = screen.getAllByTestId(/^tier-card-/)
      cards.forEach((card) => {
        expect(card).not.toHaveAttribute('data-current', 'true')
      })
    })
  })

  describe('ad slots', () => {
    it('shows both ad slots for anonymous visitor', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      expect(screen.getByTestId('ad-slot-top')).toBeInTheDocument()
      expect(screen.getByTestId('ad-slot-bottom')).toBeInTheDocument()
    })

    it('shows both ad slots for home-cook session', () => {
      mockUseAuth.mockReturnValue(tierSession('home-cook'))
      render(<PricingPage />)
      expect(screen.getByTestId('ad-slot-top')).toBeInTheDocument()
      expect(screen.getByTestId('ad-slot-bottom')).toBeInTheDocument()
    })

    it('shows no ad slots for sous-chef session', () => {
      mockUseAuth.mockReturnValue(tierSession('sous-chef'))
      render(<PricingPage />)
      expect(screen.queryByTestId('ad-slot-top')).not.toBeInTheDocument()
      expect(screen.queryByTestId('ad-slot-bottom')).not.toBeInTheDocument()
    })
  })

  describe('CTAs', () => {
    it('executive-chef card has no upgrade CTA link', () => {
      mockUseAuth.mockReturnValue(tierSession('home-cook'))
      render(<PricingPage />)
      const execCard = screen.getByTestId('tier-card-executive-chef')
      expect(execCard.querySelector('a[href="/upgrade"]')).toBeNull()
    })

    it('home-cook, prep-cook, sous-chef cards link to /upgrade for logged-in user', () => {
      mockUseAuth.mockReturnValue(tierSession('home-cook'))
      render(<PricingPage />)
      const upgradeLinks = screen.getAllByRole('link', { name: /upgrade/i })
      const hrefs = upgradeLinks.map((l) => l.getAttribute('href'))
      expect(hrefs.filter((h) => h === '/upgrade').length).toBeGreaterThanOrEqual(3)
    })

    it('non-anonymous cards link to /auth/sign-up for anonymous visitor', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const signUpLinks = screen.getAllByRole('link', { name: /get started/i })
      expect(signUpLinks.length).toBeGreaterThanOrEqual(3)
      signUpLinks.forEach((link) => {
        expect(link.getAttribute('href')).toBe('/auth/register')
      })
    })
  })
})
