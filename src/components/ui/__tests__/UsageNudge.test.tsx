import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock react-router
vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock()
})

// Mocks for hooks
const mockUseAuth = vi.fn()
const mockUseTierEntitlements = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/hooks/useTierEntitlements', () => ({
  useTierEntitlements: () => mockUseTierEntitlements(),
}))

import UsageNudge from '../UsageNudge'

describe('UsageNudge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()

    // Default logged in user on home-cook plan
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      session: { user: { tier: 'home-cook' } },
    })

    mockUseTierEntitlements.mockReturnValue({
      tier: 'home-cook',
      recipeLimit: 10,
      cookbookLimit: 1,
    })
  })

  it('renders nothing when ratio is below 70%', () => {
    const { container } = render(<UsageNudge count={6} limit={10} resourceName="recipe" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when ratio is 100% or above', () => {
    const { container } = render(<UsageNudge count={10} limit={10} resourceName="recipe" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing if the user is not logged in', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: false,
      session: null,
    })
    const { container } = render(<UsageNudge count={7} limit={10} resourceName="recipe" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders Soft Nudge when count is at 70% to 89% capacity', () => {
    render(<UsageNudge count={7} limit={10} resourceName="recipe" />)

    expect(
      screen.getByText(/You've saved 7 of 10 recipes\. Plenty of room to keep going\./i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view plan/i })).toHaveAttribute('href', '/pricing')
    expect(screen.getByRole('button', { name: /dismiss warning/i })).toBeInTheDocument()
  })

  it('handles soft nudge session dismissal correctly', async () => {
    const { container, rerender } = render(
      <UsageNudge count={7} limit={10} resourceName="recipe" />
    )

    expect(
      screen.getByText(/You've saved 7 of 10 recipes\. Plenty of room to keep going\./i)
    ).toBeInTheDocument()

    const dismissBtn = screen.getByRole('button', { name: /dismiss warning/i })
    await userEvent.click(dismissBtn)

    expect(sessionStorage.getItem('nudge_dismissed_recipe')).toBe('true')
    expect(container.firstChild).toBeNull()

    // Rerendering should still result in null (hidden)
    rerender(<UsageNudge count={7} limit={10} resourceName="recipe" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders Loud Nudge at 90% to 99% capacity with no dismiss button', () => {
    render(<UsageNudge count={9} limit={10} resourceName="recipe" />)

    expect(screen.getByText(/1 recipe left on the Home Cook plan/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /dismiss warning/i })).not.toBeInTheDocument()

    const link = screen.getByRole('link', { name: /upgrade — \$2\.99\/mo/i })
    expect(link).toHaveAttribute('href', '/pricing')
  })

  it('hides CTA button for executive-chef (highest tier)', () => {
    mockUseAuth.mockReturnValue({
      isLoggedIn: true,
      session: { user: { tier: 'executive-chef' } },
    })

    mockUseTierEntitlements.mockReturnValue({
      tier: 'executive-chef',
      recipeLimit: 2500,
      cookbookLimit: 200,
    })

    // 2400 out of 2500 is 96%, which triggers loud nudge
    render(<UsageNudge count={2400} limit={2500} resourceName="recipe" />)

    expect(screen.getByText(/100 recipes left on the Executive Chef plan/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /upgrade/i })).not.toBeInTheDocument()
  })
})
