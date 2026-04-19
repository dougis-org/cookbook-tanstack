import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageLayout from '../PageLayout'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ session: null }),
}))

describe('PageLayout', () => {
  it('renders children', () => {
    render(<PageLayout><span>hello</span></PageLayout>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<PageLayout title="My Title"><span /></PageLayout>)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<PageLayout description="A description"><span /></PageLayout>)
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('does not render title/description section when neither is provided', () => {
    const { container } = render(<PageLayout><span>content</span></PageLayout>)
    // Check that there is no H1 (title)
    expect(container.querySelector('h1')).toBeNull()
    // Check that there is no description paragraph (which would be in a div with mb-8)
    const titleSection = container.querySelector('.mb-8')
    if (titleSection) {
      // If there is an mb-8, it shouldn't contain a p unless it's an ad slot
      // Wait, AdSlot uses my-8, not mb-8.
      // But AdSlot contains a p.
    }
    // Let's just check for the specific description text if we had one, 
    // but here we check it's NULL.
    // The previous test failed because it found the AdSlot's <p>.
    // Let's check that no paragraph exists that is NOT an ad slot.
    const allPs = Array.from(container.querySelectorAll('p'))
    const descriptionPs = allPs.filter(p => !p.textContent?.includes('Advertisement Groundwork'))
    expect(descriptionPs.length).toBe(0)
  })

  it('outer wrapper uses CSS variable tokens not dark: variants', () => {
    const { container } = render(<PageLayout><span /></PageLayout>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).not.toContain('dark:')
  })
})
