import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TaxonomyBadge from '@/components/ui/TaxonomyBadge'

describe('TaxonomyBadge', () => {
  it('renders meal badge with correct styles', () => {
    render(<TaxonomyBadge name="Breakfast" variant="meal" />)
    
    const badge = screen.getByTestId('taxonomy-badge-span')
    expect(badge).toHaveClass('bg-amber-500/60')
    expect(badge).toHaveClass('text-amber-900')
  })

  it('renders course badge with correct styles', () => {
    render(<TaxonomyBadge name="Appetizer" variant="course" />)
    
    const badge = screen.getByTestId('taxonomy-badge-span')
    expect(badge).toHaveClass('bg-violet-500/60')
    expect(badge).toHaveClass('text-violet-900')
  })

  it('renders preparation badge with correct styles', () => {
    render(<TaxonomyBadge name="No-Bake" variant="preparation" />)
    
    const badge = screen.getByTestId('taxonomy-badge-span')
    expect(badge).toHaveClass('bg-emerald-500/60')
    expect(badge).toHaveClass('text-emerald-900')
  })

  it('renders icon before badge text', () => {
    render(<TaxonomyBadge name="Breakfast" variant="meal" />)
    
    const badge = screen.getByTestId('taxonomy-badge-span')
    const icon = badge.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('renders icon with aria-hidden for accessibility', () => {
    render(<TaxonomyBadge name="Breakfast" variant="meal" />)
    
    const badge = screen.getByTestId('taxonomy-badge-span')
    const icon = badge.querySelector('svg')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders different icons for different variants', () => {
    const { rerender } = render(<TaxonomyBadge name="Breakfast" variant="meal" />)
    expect(screen.getByTestId('taxonomy-badge-span')).toBeInTheDocument()
    
    rerender(<TaxonomyBadge name="Appetizer" variant="course" />)
    expect(screen.getByTestId('taxonomy-badge-span')).toBeInTheDocument()
  })

  it('maintains correct spacing and layout', () => {
    render(<TaxonomyBadge name="Breakfast" variant="meal" />)
    
    const badge = screen.getByTestId('taxonomy-badge-span')
    expect(badge).toHaveClass('inline-flex')
    expect(badge).toHaveClass('items-center')
    expect(badge).toHaveClass('gap-1')
  })

  it('has margin and padding for readability', () => {
    render(<TaxonomyBadge name="Breakfast" variant="meal" />)
    
    const badge = screen.getByTestId('taxonomy-badge-span')
    expect(badge).toHaveClass('px-2')
    expect(badge).toHaveClass('py-0.5')
    expect(badge).toHaveClass('border')
  })
})
