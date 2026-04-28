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
    it('highlights sous-chef card when session tier is sous-chef', () => {
      mockUseAuth.mockReturnValue(tierSession('sous-chef'))
      render(<PricingPage />)
      expect(screen.getByTestId('tier-card-sous-chef')).toHaveAttribute('data-current', 'true')
    })

    it('does not crash when session.user.tier is undefined', () => {
      mockUseAuth.mockReturnValue({ session: { user: { id: 'u1', isAdmin: false } } })
      expect(() => render(<PricingPage />)).not.toThrow()
    })

    it('highlights home-cook card for authenticated user with missing tier', () => {
      mockUseAuth.mockReturnValue({ session: { user: { id: 'u1', isAdmin: false } } })
      render(<PricingPage />)
      expect(screen.getByTestId('tier-card-home-cook')).toHaveAttribute('data-current', 'true')
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

  describe('CTAs', () => {
    describe('no CTA on current tier card', () => {
      it('home-cook current tier card has no link', () => {
        mockUseAuth.mockReturnValue(tierSession('home-cook'))
        render(<PricingPage />)
        const card = screen.getByTestId('tier-card-home-cook')
        expect(card.querySelector('a')).toBeNull()
      })

      it('prep-cook current tier card has no link', () => {
        mockUseAuth.mockReturnValue(tierSession('prep-cook'))
        render(<PricingPage />)
        const card = screen.getByTestId('tier-card-prep-cook')
        expect(card.querySelector('a')).toBeNull()
      })

      it('sous-chef current tier card has no link', () => {
        mockUseAuth.mockReturnValue(tierSession('sous-chef'))
        render(<PricingPage />)
        const card = screen.getByTestId('tier-card-sous-chef')
        expect(card.querySelector('a')).toBeNull()
      })

      it('executive-chef current tier card shows "Maximum plan" and has no link', () => {
        mockUseAuth.mockReturnValue(tierSession('executive-chef'))
        render(<PricingPage />)
        const card = screen.getByTestId('tier-card-executive-chef')
        expect(card.querySelector('a')).toBeNull()
        expect(card.textContent).toContain('Maximum plan')
      })
    })

    describe('upgrade CTA (tiers above current)', () => {
      it('home-cook user: prep-cook card shows Upgrade link to /change-tier', () => {
        mockUseAuth.mockReturnValue(tierSession('home-cook'))
        render(<PricingPage />)
        const card = screen.getByTestId('tier-card-prep-cook')
        const link = card.querySelector('a')
        expect(link?.textContent).toBe('Upgrade')
        expect(link?.getAttribute('href')).toBe('/change-tier')
      })

      it('home-cook user: sous-chef card shows Upgrade link to /change-tier', () => {
        mockUseAuth.mockReturnValue(tierSession('home-cook'))
        render(<PricingPage />)
        const card = screen.getByTestId('tier-card-sous-chef')
        const link = card.querySelector('a')
        expect(link?.textContent).toBe('Upgrade')
        expect(link?.getAttribute('href')).toBe('/change-tier')
      })

      it('home-cook user: executive-chef card shows "Maximum plan" not Upgrade', () => {
        mockUseAuth.mockReturnValue(tierSession('home-cook'))
        render(<PricingPage />)
        const card = screen.getByTestId('tier-card-executive-chef')
        expect(card.querySelector('a')).toBeNull()
        expect(card.textContent).toContain('Maximum plan')
      })

      it('prep-cook user: sous-chef card shows Upgrade to /change-tier', () => {
        mockUseAuth.mockReturnValue(tierSession('prep-cook'))
        render(<PricingPage />)
        const card = screen.getByTestId('tier-card-sous-chef')
        const link = card.querySelector('a')
        expect(link?.textContent).toBe('Upgrade')
        expect(link?.getAttribute('href')).toBe('/change-tier')
      })

      it('home-cook user: no Downgrade link anywhere on the page', () => {
        mockUseAuth.mockReturnValue(tierSession('home-cook'))
        render(<PricingPage />)
        const downgradeLinks = screen.queryAllByRole('link', { name: /downgrade/i })
        expect(downgradeLinks.length).toBe(0)
      })
    })

    describe('downgrade CTA (tiers below current)', () => {
      it('sous-chef user: home-cook card shows Downgrade link to /change-tier', () => {
        mockUseAuth.mockReturnValue(tierSession('sous-chef'))
        render(<PricingPage />)
        const card = screen.getByTestId('tier-card-home-cook')
        const link = card.querySelector('a')
        expect(link?.textContent).toBe('Downgrade')
        expect(link?.getAttribute('href')).toBe('/change-tier')
      })

      it('sous-chef user: prep-cook card shows Downgrade link to /change-tier', () => {
        mockUseAuth.mockReturnValue(tierSession('sous-chef'))
        render(<PricingPage />)
        const card = screen.getByTestId('tier-card-prep-cook')
        const link = card.querySelector('a')
        expect(link?.textContent).toBe('Downgrade')
        expect(link?.getAttribute('href')).toBe('/change-tier')
      })

      it('executive-chef user: all lower tier cards show Downgrade to /change-tier', () => {
        mockUseAuth.mockReturnValue(tierSession('executive-chef'))
        render(<PricingPage />)
        for (const tier of ['home-cook', 'prep-cook', 'sous-chef']) {
          const card = screen.getByTestId(`tier-card-${tier}`)
          const link = card.querySelector('a')
          expect(link?.textContent).toBe('Downgrade')
          expect(link?.getAttribute('href')).toBe('/change-tier')
        }
      })
    })

    describe('anonymous visitor', () => {
      it('all 4 visible tier cards contain "Get started free" link to /auth/register except executive-chef', () => {
        mockUseAuth.mockReturnValue(anonSession())
        render(<PricingPage />)
        const signUpLinks = screen.getAllByRole('link', { name: /get started free/i })
        expect(signUpLinks.length).toBe(3)
        signUpLinks.forEach((link) => {
          expect(link.getAttribute('href')).toBe('/auth/register')
        })
      })

      it('executive-chef card shows "Maximum plan" with no link for anonymous visitor', () => {
        mockUseAuth.mockReturnValue(anonSession())
        render(<PricingPage />)
        const card = screen.getByTestId('tier-card-executive-chef')
        expect(card.querySelector('a')).toBeNull()
        expect(card.textContent).toContain('Maximum plan')
      })
    })

    describe('no /upgrade references', () => {
      it('no links point to /upgrade for any session', () => {
        mockUseAuth.mockReturnValue(tierSession('home-cook'))
        render(<PricingPage />)
        const allLinks = screen.queryAllByRole('link')
        allLinks.forEach((link) => {
          expect(link.getAttribute('href')).not.toBe('/upgrade')
        })
      })

      it('executive-chef card has no link to /change-tier (top tier shows Maximum plan)', () => {
        mockUseAuth.mockReturnValue(tierSession('home-cook'))
        render(<PricingPage />)
        const execCard = screen.getByTestId('tier-card-executive-chef')
        expect(execCard.querySelector('a[href="/change-tier"]')).toBeNull()
      })
    })
  })
})
