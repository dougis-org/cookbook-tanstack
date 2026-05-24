import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRouterMock } from '@/test-helpers/mocks'

// Mock react-router
vi.mock('@tanstack/react-router', () => createRouterMock())

import UsageNudge from '../UsageNudge'
import { getLoudNudgeCTA } from '@/lib/nudgeCopy'

describe('UsageNudge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('renders nothing when ratio is below 70%', () => {
    const { container } = render(
      <UsageNudge
        count={6}
        limit={10}
        resourceName="recipe"
        tier="home-cook"
        nextTier="prep-cook"
        tierDisplayName="Home Cook"
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when ratio is 100% or above', () => {
    const { container } = render(
      <UsageNudge
        count={10}
        limit={10}
        resourceName="recipe"
        tier="home-cook"
        nextTier="prep-cook"
        tierDisplayName="Home Cook"
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders Soft Nudge when count is at 70% to 89% capacity', () => {
    render(
      <UsageNudge
        count={7}
        limit={10}
        resourceName="recipe"
        tier="home-cook"
        nextTier="prep-cook"
        tierDisplayName="Home Cook"
      />
    )

    expect(
      screen.getByText(/You've saved 7 of 10 recipes\. Plenty of room to keep going\./i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view plan/i })).toHaveAttribute('href', '/pricing')
    expect(screen.getByRole('button', { name: /dismiss warning/i })).toBeInTheDocument()
  })

  it('handles soft nudge session dismissal correctly', async () => {
    const { container, rerender } = render(
      <UsageNudge
        count={7}
        limit={10}
        resourceName="recipe"
        tier="home-cook"
        nextTier="prep-cook"
        tierDisplayName="Home Cook"
      />
    )

    expect(
      screen.getByText(/You've saved 7 of 10 recipes\. Plenty of room to keep going\./i)
    ).toBeInTheDocument()

    const dismissBtn = screen.getByRole('button', { name: /dismiss warning/i })
    await userEvent.click(dismissBtn)

    expect(sessionStorage.getItem('nudge_dismissed_recipe')).toBe('true')
    expect(container.firstChild).toBeNull()

    // Rerendering should still result in null (hidden)
    rerender(
      <UsageNudge
        count={7}
        limit={10}
        resourceName="recipe"
        tier="home-cook"
        nextTier="prep-cook"
        tierDisplayName="Home Cook"
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders Loud Nudge at 90% to 99% capacity with no dismiss button, warning tokens, and correct progress width', () => {
    const { container } = render(
      <UsageNudge
        count={9}
        limit={10}
        resourceName="recipe"
        tier="home-cook"
        nextTier="prep-cook"
        tierDisplayName="Home Cook"
      />
    )

    // Verify main copy
    expect(screen.getByText(/1 recipe left on the Home Cook plan/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /dismiss warning/i })).not.toBeInTheDocument()

    // Verify upgrade description copy
    expect(
      screen.getByText(/Upgrade to Prep Cook to unlock up to 100 recipes and 10 cookbooks/i)
    ).toBeInTheDocument()

    // Verify CTA button and link
    const link = screen.getByRole('link', { name: /upgrade — \$2\.99\/mo/i })
    expect(link).toHaveAttribute('href', '/pricing')

    // Verify warning-tone tokens applied to the banner
    const innerContainer = container.querySelector('.border-\\[var\\(--theme-warning-border\\)\\]')
    expect(innerContainer).toBeInTheDocument()
    expect(innerContainer).toHaveClass('bg-[var(--theme-warning-bg)]')
    expect(innerContainer).toHaveClass('text-[var(--theme-fg)]')

    // Verify progress bar style width reflects ratio (90%)
    const progressBar = screen.getByTestId('nudge-progress')
    expect(progressBar).toHaveStyle('width: 90%')
  })

  it('hides CTA button for executive-chef (highest tier)', () => {
    // 2400 out of 2500 is 96%, which triggers loud nudge
    render(
      <UsageNudge
        count={2400}
        limit={2500}
        resourceName="recipe"
        tier="executive-chef"
        nextTier={null}
        tierDisplayName="Executive Chef"
      />
    )

    expect(screen.getByText(/100 recipes left on the Executive Chef plan/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /upgrade/i })).not.toBeInTheDocument()
  })

  it('returns default CTA text when next tier has null price', () => {
    expect(getLoudNudgeCTA('home-cook')).toBe('Upgrade')
  })
})

