import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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

import { PricingPage, Route } from '@/routes/pricing'

function anonSession() {
  return { session: null }
}

function tierSession(tier: string) {
  return { session: { user: { id: 'u1', tier, isAdmin: false } } }
}

describe('/pricing', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(anonSession())
    vi.spyOn(Route, 'useSearch').mockReturnValue({ focus: undefined })
  })

  describe('tier table', () => {
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

  describe('tier highlight and focus', () => {
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

    it('applies focus highlight when focus query parameter is supplied', () => {
      vi.spyOn(Route, 'useSearch').mockReturnValue({ focus: 'sous-chef' })
      render(<PricingPage />)
      
      const sousCard = screen.getByTestId('tier-card-sous-chef')
      expect(sousCard).toHaveAttribute('data-focused', 'true')
      expect(sousCard.className).toContain('border-[var(--theme-accent)]')
      expect(screen.getByTestId('tier-card-home-cook')).not.toHaveAttribute('data-focused')
    })
  })

  describe('ad slots', () => {
    it('does not render AdSense slots outside production for anonymous visitors', () => {
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

  describe('billing frequency toggle and pricing', () => {
    it('renders the toggle and defaults to annual billing', () => {
      render(<PricingPage />)
      const toggleContainer = screen.getByTestId('billing-toggle')
      expect(toggleContainer).toBeInTheDocument()
      expect(screen.getByText('Save 2 months')).toBeInTheDocument()
      
      const annualBtn = screen.getByRole('radio', { name: /annual/i })
      const monthlyBtn = screen.getByRole('radio', { name: /monthly/i })
      expect(annualBtn).toHaveAttribute('aria-checked', 'true')
      expect(monthlyBtn).toHaveAttribute('aria-checked', 'false')
    })

    it('toggles billing frequency and updates active state', () => {
      render(<PricingPage />)
      const monthlyBtn = screen.getByRole('radio', { name: /monthly/i })
      const annualBtn = screen.getByRole('radio', { name: /annual/i })
      
      fireEvent.click(monthlyBtn)
      expect(monthlyBtn).toHaveAttribute('aria-checked', 'true')
      expect(annualBtn).toHaveAttribute('aria-checked', 'false')
      expect(screen.queryByText('Save 2 months')).not.toBeInTheDocument()

      fireEvent.click(annualBtn)
      expect(annualBtn).toHaveAttribute('aria-checked', 'true')
      expect(monthlyBtn).toHaveAttribute('aria-checked', 'false')
      expect(screen.getByText('Save 2 months')).toBeInTheDocument()
    })

    it('calculates and renders prices under annual and monthly states correctly', () => {
      render(<PricingPage />)
      expect(screen.getByTestId('tier-card-home-cook').textContent).toContain('FREE')
      
      const prepCard = screen.getByTestId('tier-card-prep-cook')
      expect(prepCard.textContent).toContain('$2.33/mo')
      expect(prepCard.textContent).toContain('Billed annually · $27.99/yr')

      const monthlyBtn = screen.getByRole('radio', { name: /monthly/i })
      fireEvent.click(monthlyBtn)

      expect(prepCard.textContent).toContain('$2.99/mo')
      expect(prepCard.textContent).not.toContain('Billed annually')
      expect(screen.getByTestId('tier-card-home-cook').textContent).toContain('FREE')
    })

    it('supports keyboard navigation via Arrow keys (horizontal and vertical, specific selection)', () => {
      render(<PricingPage />)
      const radiogroup = screen.getByRole('radiogroup', { name: /billing frequency/i })
      const annualBtn = screen.getByRole('radio', { name: /annual/i })
      const monthlyBtn = screen.getByRole('radio', { name: /monthly/i })

      expect(annualBtn).toHaveAttribute('aria-checked', 'true')

      // Keydown ArrowLeft specifically selects Monthly
      fireEvent.keyDown(radiogroup, { key: 'ArrowLeft' })
      expect(monthlyBtn).toHaveAttribute('aria-checked', 'true')
      expect(annualBtn).toHaveAttribute('aria-checked', 'false')

      // Keydown ArrowLeft again does nothing (Monthly stays active)
      fireEvent.keyDown(radiogroup, { key: 'ArrowLeft' })
      expect(monthlyBtn).toHaveAttribute('aria-checked', 'true')

      // Keydown ArrowRight specifically selects Annual
      fireEvent.keyDown(radiogroup, { key: 'ArrowRight' })
      expect(annualBtn).toHaveAttribute('aria-checked', 'true')
      expect(monthlyBtn).toHaveAttribute('aria-checked', 'false')

      // Keydown ArrowUp specifically selects Monthly
      fireEvent.keyDown(radiogroup, { key: 'ArrowUp' })
      expect(monthlyBtn).toHaveAttribute('aria-checked', 'true')
      expect(annualBtn).toHaveAttribute('aria-checked', 'false')

      // Keydown ArrowDown specifically selects Annual
      fireEvent.keyDown(radiogroup, { key: 'ArrowDown' })
      expect(annualBtn).toHaveAttribute('aria-checked', 'true')
      expect(monthlyBtn).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('Prep Cook visual highlight', () => {
    it('visually highlights Prep Cook card as most popular', () => {
      render(<PricingPage />)
      const card = screen.getByTestId('tier-card-prep-cook')
      expect(card.textContent).toContain('Most popular')
      expect(card.className).toContain('border-[var(--theme-accent)]')
      expect(card.className).toContain('ring-2')
      expect(card.className).toContain('ring-[var(--theme-accent)]')
    })
  })

  describe('context-aware CTAs', () => {
    it('renders disabled "Current plan" button for the active tier card', () => {
      mockUseAuth.mockReturnValue(tierSession('prep-cook'))
      render(<PricingPage />)
      
      const prepCard = screen.getByTestId('tier-card-prep-cook')
      const btn = within(prepCard).getByRole('button')
      expect(btn).toBeDisabled()
      expect(btn.textContent).toBe('Current plan')
    })

    it('renders active "/change-tier" links on other cards', () => {
      mockUseAuth.mockReturnValue(tierSession('prep-cook'))
      render(<PricingPage />)
      
      const homeCard = screen.getByTestId('tier-card-home-cook')
      const sousCard = screen.getByTestId('tier-card-sous-chef')
      
      const homeLink = within(homeCard).getByRole('link')
      expect(homeLink.getAttribute('href')).toBe('/change-tier')
      expect(homeLink.textContent).toBe('Select Plan')

      const sousLink = within(sousCard).getByRole('link')
      expect(sousLink.getAttribute('href')).toBe('/change-tier')
      expect(sousLink.textContent).toBe('Upgrade')
    })
  })

  describe('reassurance trust row', () => {
    it('renders reassurance row with 3 columns and correct icons', () => {
      render(<PricingPage />)
      expect(screen.getByText('Cancel anytime')).toBeInTheDocument()
      expect(screen.getByText('30-day guarantee')).toBeInTheDocument()
      expect(screen.getByText('Export anytime')).toBeInTheDocument()
    })
  })

  describe('FAQ Accordion', () => {
    it('defaults to first item expanded and others collapsed', () => {
      render(<PricingPage />)
      const faqAnswer1 = screen.getByText(/You can cancel your subscription at any time/i)
      expect(faqAnswer1).toBeVisible()
      expect(screen.queryByText(/If you are not completely satisfied/i)).not.toBeInTheDocument()
    })

    it('toggles FAQ item expansion on click', () => {
      render(<PricingPage />)
      const secondHeader = screen.getByText('What is the 30-day money-back guarantee?')
      fireEvent.click(secondHeader)
      
      expect(screen.getByText(/If you are not completely satisfied/i)).toBeVisible()
      expect(screen.queryByText(/You can cancel your subscription at any time/i)).not.toBeInTheDocument()
    })

    it('applies aria-controls conditionally based on expanded state', () => {
      render(<PricingPage />)
      const firstHeader = screen.getByText('Can I cancel my subscription at any time?').closest('button')!
      const secondHeader = screen.getByText('What is the 30-day money-back guarantee?').closest('button')!

      // First is expanded by default, so it should have aria-controls
      expect(firstHeader).toHaveAttribute('aria-controls')
      // Second is collapsed, so it should NOT have aria-controls
      expect(secondHeader).not.toHaveAttribute('aria-controls')

      // Click second to expand it
      fireEvent.click(secondHeader)
      expect(secondHeader).toHaveAttribute('aria-controls')
      expect(firstHeader).not.toHaveAttribute('aria-controls')
    })
  })

  describe('ad status display', () => {
    const cases = [
      { tier: 'home-cook', expected: 'Ad Supported' },
      { tier: 'prep-cook', expected: 'No Ads' },
      { tier: 'sous-chef', expected: 'No Ads' },
      { tier: 'executive-chef', expected: 'No Ads' },
    ] as const

    it.each(cases)('$tier displays "$expected"', ({ tier, expected }) => {
      render(<PricingPage />)
      const card = screen.getByTestId(`tier-card-${tier}`)
      expect(card.textContent).toContain(expected)
    })
  })

  describe('import capability display', () => {
    const cases = [
      { tier: 'home-cook', expected: 'No import' },
      { tier: 'prep-cook', expected: 'No import' },
      { tier: 'sous-chef', expected: 'No import' },
      { tier: 'executive-chef', expected: 'Import ✓' },
    ] as const

    it.each(cases)('$tier displays "$expected"', ({ tier, expected }) => {
      render(<PricingPage />)
      const card = screen.getByTestId(`tier-card-${tier}`)
      expect(card.textContent).toContain(expected)
    })
  })

  describe("pricing route validation", () => {
    it("validates search query params", () => {
      const validateSearch = Route.options.validateSearch as any
      if (!validateSearch) throw new Error("validateSearch not defined")
      expect(validateSearch({ focus: "prep-cook" })).toEqual({ focus: "prep-cook" })
      expect(validateSearch({})).toEqual({ focus: undefined })
      expect(validateSearch({ focus: 123 })).toEqual({ focus: undefined })
      expect(validateSearch({ focus: "invalid-tier" })).toEqual({ focus: undefined })
    })
  })
})
