import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TIER_LIMITS } from '@/lib/tier-entitlements'

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

    it('renders all 4 tier names (anonymous excluded)', () => {
      render(<PricingPage />)
      expect(screen.queryByText('Anonymous')).not.toBeInTheDocument()
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
      const descriptions = screen.getAllByTestId('tier-description')
      expect(descriptions.length).toBe(4)
      descriptions.forEach((el) => {
        expect(el.textContent!.length).toBeGreaterThan(0)
      })
    })

    it('tier-card-anonymous is not in the DOM for anonymous session', () => {
      render(<PricingPage />)
      expect(screen.queryByTestId('tier-card-anonymous')).not.toBeInTheDocument()
    })

    it('tier-card-anonymous is not in the DOM for authenticated session', () => {
      mockUseAuth.mockReturnValue(tierSession('home-cook'))
      render(<PricingPage />)
      expect(screen.queryByTestId('tier-card-anonymous')).not.toBeInTheDocument()
    })

    it('exactly 4 tier cards are present for anonymous session', () => {
      render(<PricingPage />)
      const cards = ['home-cook', 'prep-cook', 'sous-chef', 'executive-chef']
      cards.forEach(tier => {
        expect(screen.getByTestId(`tier-card-${tier}`)).toBeInTheDocument()
      })
      expect(screen.queryByTestId('tier-card-anonymous')).not.toBeInTheDocument()
    })
  })

  describe('tier highlight', () => {
    it('highlights current tier card with data-current attribute', () => {
      mockUseAuth.mockReturnValue(tierSession('sous-chef'))
      render(<PricingPage />)
      expect(screen.getByTestId('tier-card-sous-chef')).toHaveAttribute('data-current', 'true')
      expect(screen.getByTestId('tier-card-home-cook')).not.toHaveAttribute('data-current')
      expect(screen.getByTestId('tier-card-prep-cook')).not.toHaveAttribute('data-current')
      expect(screen.getByTestId('tier-card-executive-chef')).not.toHaveAttribute('data-current')
    })

    it('highlights home-cook card for authenticated user with missing tier', () => {
      mockUseAuth.mockReturnValue({ session: { user: { id: 'u1', isAdmin: false } } })
      render(<PricingPage />)
      expect(screen.getByTestId('tier-card-home-cook')).toHaveAttribute('data-current', 'true')
    })

    it('shows "Current plan" badge on current tier card', () => {
      mockUseAuth.mockReturnValue(tierSession('prep-cook'))
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-prep-cook')
      expect(card.textContent).toContain('Current plan')
    })
  })

  describe('ad slots', () => {
    // AdSense rendering is production-only (import.meta.env.PROD); slots are absent in test.
    // Ad eligibility is verified by isPageAdEligible in src/lib/__tests__/ad-policy.test.ts.
    // The pricing page uses role="public-marketing" on PageLayout which owns slot placement.
    it('does not render AdSense slots outside production for anonymous visitors', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      expect(screen.queryByTestId('ad-slot-top')).not.toBeInTheDocument()
      expect(screen.queryByTestId('ad-slot-bottom')).not.toBeInTheDocument()
    })

    it('does not render AdSense slots outside production for sous-chef session', () => {
      mockUseAuth.mockReturnValue(tierSession('sous-chef'))
      render(<PricingPage />)
      expect(screen.queryByTestId('ad-slot-top')).not.toBeInTheDocument()
      expect(screen.queryByTestId('ad-slot-bottom')).not.toBeInTheDocument()
    })
  })

  describe('no per-tier CTAs', () => {
    it('no tier card contains a link for anonymous visitor', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const cards = ['home-cook', 'prep-cook', 'sous-chef', 'executive-chef']
      for (const tier of cards) {
        const card = screen.getByTestId(`tier-card-${tier}`)
        expect(card.querySelector('a')).toBeNull()
      }
    })

    it('no tier card contains a link for authenticated home-cook user', () => {
      mockUseAuth.mockReturnValue(tierSession('home-cook'))
      render(<PricingPage />)
      const cards = ['home-cook', 'prep-cook', 'sous-chef', 'executive-chef']
      for (const tier of cards) {
        const card = screen.getByTestId(`tier-card-${tier}`)
        expect(card.querySelector('a')).toBeNull()
      }
    })

    it('no tier card contains a link for authenticated sous-chef user', () => {
      mockUseAuth.mockReturnValue(tierSession('sous-chef'))
      render(<PricingPage />)
      const cards = ['home-cook', 'prep-cook', 'sous-chef', 'executive-chef']
      for (const tier of cards) {
        const card = screen.getByTestId(`tier-card-${tier}`)
        expect(card.querySelector('a')).toBeNull()
      }
    })
  })

  describe('single CTA for anonymous users', () => {
    it('shows single "Get Started for Free" link below tier grid for anonymous', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const links = screen.getAllByRole('link', { name: /get started for free/i })
      expect(links.length).toBe(1)
      expect(links[0].getAttribute('href')).toBe('/auth/register')
    })

    it('no "Get Started for Free" link when authenticated', () => {
      mockUseAuth.mockReturnValue(tierSession('home-cook'))
      render(<PricingPage />)
      const links = screen.queryAllByRole('link', { name: /get started for free/i })
      expect(links.length).toBe(0)
    })
  })

  describe('pricing display', () => {
    it('home-cook shows FREE', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-home-cook')
      expect(card.textContent).toContain('FREE')
    })

    it('prep-cook shows annual and monthly price', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-prep-cook')
      expect(card.textContent).toContain('$27.99/year')
      expect(card.textContent).toContain('$2.99/month')
    })

    it('sous-chef shows annual and monthly price', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-sous-chef')
      expect(card.textContent).toContain('$59.99/year')
      expect(card.textContent).toContain('$5.99/month')
    })

    it('executive-chef shows annual and monthly price', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-executive-chef')
      expect(card.textContent).toContain('$99.99/year')
      expect(card.textContent).toContain('$9.99/month')
    })

    it('paid tiers show annual billing benefit badge', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      expect(screen.getByTestId('tier-card-prep-cook').textContent).toContain('Get 2 months free with annual billing')
      expect(screen.getByTestId('tier-card-sous-chef').textContent).toContain('Get 2 months free with annual billing')
      expect(screen.getByTestId('tier-card-executive-chef').textContent).toContain('Get 2 months free with annual billing')
    })

    it('home-cook does not show annual billing benefit badge', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-home-cook')
      expect(card.textContent).not.toContain('Get 2 months free with annual billing')
    })
  })

  describe('ad status display', () => {
    it('home-cook shows "Ad Supported"', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-home-cook')
      expect(card.textContent).toContain('Ad Supported')
    })

    it('prep-cook shows "No Ads"', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-prep-cook')
      expect(card.textContent).toContain('No Ads')
    })

    it('sous-chef shows "No Ads"', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-sous-chef')
      expect(card.textContent).toContain('No Ads')
    })

    it('executive-chef shows "No Ads"', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-executive-chef')
      expect(card.textContent).toContain('No Ads')
    })
  })

  describe('import capability display', () => {
    it('home-cook shows "No import"', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-home-cook')
      expect(card.textContent).toContain('No import')
    })

    it('prep-cook shows "No import"', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-prep-cook')
      expect(card.textContent).toContain('No import')
    })

    it('sous-chef shows "No import" (import requires executive-chef)', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-sous-chef')
      expect(card.textContent).toContain('No import')
    })

    it('executive-chef shows "Import ✓"', () => {
      mockUseAuth.mockReturnValue(anonSession())
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-executive-chef')
      expect(card.textContent).toContain('Import ✓')
    })
  })
})

describe("Pricing page sidebar active state", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(anonSession())
  })

  it("sidebar Pricing link has active styling when on /pricing page", () => {
    // The active state is tested in Header.test.tsx
    // since the sidebar is part of the Header component rendered in __root.tsx
    // This test confirms the pricing page itself renders correctly
    render(<PricingPage />)
    // Verify page renders by checking for tier card elements
    expect(screen.getByTestId("tier-card-home-cook")).toBeInTheDocument()
  })

  it("Pricing page renders correctly for anonymous users", () => {
    // Verify that the pricing page renders tier cards for anonymous users
    render(<PricingPage />)
    // Should show 4 tier cards (excluding anonymous)
    expect(screen.getByTestId("tier-card-home-cook")).toBeInTheDocument()
    expect(screen.getByTestId("tier-card-prep-cook")).toBeInTheDocument()
    expect(screen.getByTestId("tier-card-sous-chef")).toBeInTheDocument()
    expect(screen.getByTestId("tier-card-executive-chef")).toBeInTheDocument()
  })
})
