import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaxonomyChips } from '../TaxonomyChips'
import { MOCK_MEALS } from './test-helpers'

describe('TaxonomyChips', () => {
  let mockOnToggle: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnToggle = vi.fn()
  })

  it('renders label', () => {
    render(
      <TaxonomyChips
        items={MOCK_MEALS}
        selectedIds={[]}
        label="Meals"
        onToggle={mockOnToggle}
      />
    )
    expect(screen.getByText('Meals')).toBeInTheDocument()
  })

  it('renders all items as chips', () => {
    render(
      <TaxonomyChips
        items={MOCK_MEALS}
        selectedIds={[]}
        label="Meals"
        onToggle={mockOnToggle}
      />
    )
    MOCK_MEALS.forEach(meal => {
      expect(screen.getByText(meal.name)).toBeInTheDocument()
    })
  })

  it('toggles chip when clicked', async () => {
    const user = userEvent.setup()
    render(
      <TaxonomyChips
        items={MOCK_MEALS}
        selectedIds={[]}
        label="Meals"
        onToggle={mockOnToggle}
      />
    )
    const button = screen.getByText('Breakfast').closest('button')!
    await user.click(button)
    expect(mockOnToggle).toHaveBeenCalledWith('m1')
  })

  it('displays active styling for selected items', () => {
    render(
      <TaxonomyChips
        items={MOCK_MEALS}
        selectedIds={['m1', 'm3']}
        label="Meals"
        onToggle={mockOnToggle}
      />
    )
    const breakfastButton = screen.getByText('Breakfast').closest('button')!
    const dinnerButton = screen.getByText('Dinner').closest('button')!
    const lunchButton = screen.getByText('Lunch').closest('button')!

    expect(breakfastButton).toHaveClass('bg-cyan-500/20', 'border-cyan-500', 'text-cyan-300')
    expect(dinnerButton).toHaveClass('bg-cyan-500/20', 'border-cyan-500', 'text-cyan-300')
    expect(lunchButton).toHaveClass('bg-slate-800', 'border-slate-700', 'text-gray-400')
  })

  it('displays counts when provided', () => {
    render(
      <TaxonomyChips
        items={MOCK_MEALS}
        selectedIds={[]}
        label="Meals"
        onToggle={mockOnToggle}
        counts={{ m1: 5, m2: 8, m3: 12 }}
      />
    )
    expect(screen.getByText(/Breakfast/)).toHaveTextContent('(5)')
    expect(screen.getByText(/Lunch/)).toHaveTextContent('(8)')
    expect(screen.getByText(/Dinner/)).toHaveTextContent('(12)')
  })

  it('returns null when items are undefined', () => {
    const { container } = render(
      <TaxonomyChips
        items={undefined}
        selectedIds={[]}
        label="Meals"
        onToggle={mockOnToggle}
      />
    )
    expect(container.firstChild).toBeNull()
  })
})
