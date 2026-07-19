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

import { PrivacyPolicyPage } from '@/routes/privacy-policy'

describe('/privacy-policy', () => {
  it('renders without an authenticated session', () => {
    mockUseAuth.mockReturnValue({ session: null })
    render(<PrivacyPolicyPage />)
    expect(screen.getByText('Your Account')).toBeInTheDocument()
  })

  it('renders all five expected section headings', () => {
    mockUseAuth.mockReturnValue({ session: null })
    render(<PrivacyPolicyPage />)
    expect(screen.getByText('Your Account')).toBeInTheDocument()
    expect(screen.getByText('Your Recipes & Cookbooks')).toBeInTheDocument()
    expect(screen.getByText('Billing')).toBeInTheDocument()
    expect(screen.getByText('Third-Party Sharing')).toBeInTheDocument()
    expect(screen.getByText('Changes to This Policy')).toBeInTheDocument()
  })

  it('states the read:own-content OAuth scope in the Third-Party Sharing section', () => {
    mockUseAuth.mockReturnValue({ session: null })
    render(<PrivacyPolicyPage />)
    expect(screen.getByText(/read:own-content/)).toBeInTheDocument()
  })

  it('states that password, email, and payment data are not shared with third parties', () => {
    mockUseAuth.mockReturnValue({ session: null })
    render(<PrivacyPolicyPage />)
    expect(screen.getByText(/password.*email.*payment/is)).toBeInTheDocument()
  })

  it('states that linked accounts are user-revocable', () => {
    mockUseAuth.mockReturnValue({ session: null })
    render(<PrivacyPolicyPage />)
    expect(screen.getByText(/revoke/i)).toBeInTheDocument()
  })
})
