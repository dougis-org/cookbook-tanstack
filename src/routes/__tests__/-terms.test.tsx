import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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

import { TermsPage } from '@/routes/terms'

describe('/terms', () => {
  it('renders without an authenticated session', () => {
    mockUseAuth.mockReturnValue({ session: null })
    render(<TermsPage />)
    expect(screen.getByText('Your Account')).toBeInTheDocument()
  })

  it('renders all eight expected section headings', () => {
    mockUseAuth.mockReturnValue({ session: null })
    render(<TermsPage />)
    expect(screen.getByText('Your Account')).toBeInTheDocument()
    expect(screen.getByText('Your Content')).toBeInTheDocument()
    expect(screen.getByText('Acceptable Use')).toBeInTheDocument()
    expect(screen.getByText('Billing & Subscriptions')).toBeInTheDocument()
    expect(screen.getByText('Third-Party Connections')).toBeInTheDocument()
    expect(screen.getByText('Termination')).toBeInTheDocument()
    expect(screen.getByText('Disclaimers')).toBeInTheDocument()
    expect(screen.getByText('Changes to These Terms')).toBeInTheDocument()
  })

  it('states that paid tiers are billed through Stripe and renew automatically', () => {
    mockUseAuth.mockReturnValue({ session: null })
    render(<TermsPage />)
    expect(screen.getByText(/Stripe/)).toBeInTheDocument()
    expect(screen.getByText(/renew/i)).toBeInTheDocument()
  })

  it('states user retains content ownership and grants a limited license', () => {
    mockUseAuth.mockReturnValue({ session: null })
    render(<TermsPage />)
    expect(screen.getByText(/yours/i)).toBeInTheDocument()
    expect(screen.getByText(/license/i)).toBeInTheDocument()
  })

  it('links to /privacy-policy in Third-Party Connections and does not restate the OAuth scope name', () => {
    mockUseAuth.mockReturnValue({ session: null })
    render(<TermsPage />)
    const privacyLink = screen.getByRole('link', { name: /Privacy Policy/i })
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy')
    expect(screen.queryByText(/read:own-content/)).not.toBeInTheDocument()
  })

  it('does not name a governing law, jurisdiction, or arbitration process', () => {
    mockUseAuth.mockReturnValue({ session: null })
    render(<TermsPage />)
    expect(screen.queryByText(/governing law|jurisdiction|arbitration/i)).not.toBeInTheDocument()
  })
})
