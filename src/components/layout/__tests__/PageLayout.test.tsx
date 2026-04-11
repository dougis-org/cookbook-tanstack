import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageLayout from '../PageLayout'

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
    expect(container.querySelector('h1')).toBeNull()
    expect(container.querySelector('p')).toBeNull()
  })

  it('outer wrapper uses CSS variable tokens not dark: variants', () => {
    const { container } = render(<PageLayout><span /></PageLayout>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).not.toContain('dark:')
  })
})
