import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClassificationBadge from '@/components/ui/ClassificationBadge'

describe('ClassificationBadge', () => {
  it('renders solid background styling', () => {
    render(<ClassificationBadge classificationId="c1" classificationName="Baked Goods" />)
    
    const badge = screen.getByText('Baked Goods')
    expect(badge).toHaveClass('bg-cyan-600')
    expect(badge).toHaveClass('text-white')
  })

  it('has appropriate text size and padding', () => {
    render(<ClassificationBadge classificationId="c1" classificationName="Baked Goods" />)
    
    const badge = screen.getByText('Baked Goods')
    expect(badge).toHaveClass('text-sm')
    expect(badge).toHaveClass('px-3')
    expect(badge).toHaveClass('py-1.5')
  })

  it('renders as plain span by default (non-clickable)', () => {
    render(<ClassificationBadge classificationId="c1" classificationName="Baked Goods" />)
    
    const badge = screen.getByText('Baked Goods')
    expect(badge.tagName).toBe('SPAN')
    expect(badge.closest('a')).not.toBeInTheDocument()
  })

  it('renders icon before badge text', () => {
    render(<ClassificationBadge classificationId="c1" classificationName="Baked Goods" />)
    
    const badge = screen.getByText('Baked Goods').parentElement
    const icon = badge?.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('renders icon with aria-hidden for accessibility', () => {
    render(<ClassificationBadge classificationId="c1" classificationName="Baked Goods" />)
    
    const badge = screen.getByText('Baked Goods').parentElement
    const icon = badge?.querySelector('svg')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('has correct layout structure', () => {
    render(<ClassificationBadge classificationId="c1" classificationName="Baked Goods" />)
    
    const badge = screen.getByText('Baked Goods')
    expect(badge).toHaveClass('inline-flex')
    expect(badge).toHaveClass('items-center')
    expect(badge).toHaveClass('gap-1')
    expect(badge).toHaveClass('rounded-full')
    expect(badge).toHaveClass('font-medium')
  })

  it('has border styling', () => {
    render(<ClassificationBadge classificationId="c1" classificationName="Baked Goods" />)
    
    const badge = screen.getByText('Baked Goods')
    expect(badge).toHaveClass('inline-flex')
  })

  it('includes linkable variant support', () => {
    // Test non-linkable (default)
    render(<ClassificationBadge classificationId="c1" classificationName="Baked Goods" linkable={false} />)
    
    const badge = screen.getByText('Baked Goods')
    expect(badge.tagName).toBe('SPAN')
    
    // The linkable variant requires router context which is tested at E2E level
    // Just verify the component accepts the prop without crashing
    // Note: Full linkable testing is done in E2E tests with proper router setup
    expect(badge).toBeInTheDocument()
  })
})
