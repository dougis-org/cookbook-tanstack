import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaxonomyChips } from '../TaxonomyChips'

const mockMeals = [
  { id: 'm1', name: 'Breakfast' },
  { id: 'm2', name: 'Lunch' },
  { id: 'm3', name: 'Dinner' },
]

describe('TaxonomyChips', () => {
  const mockOnToggle = vi.fn()

  beforeEach(() => {
    mockOnToggle.mockClear()
  })

  it('renders label', () => {
    render(
      <TaxonomyChips
        items={mockMeals}
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
        items={mockMeals}
        selectedIds={[]}
        label="Meals"
        onToggle={mockOnToggle}
      />
    )
    expect(screen.getByText('Breakfast')).toBeInTheDocument()
    expect(screen.getByText('Lunch')).toBeInTheDocument()
    expect(screen.getByText('Dinner')).toBeInTheDocument()
  })

  it('calls onToggle when a chip is clicked', async () => {
    const user = userEvent.setup()
    render(
      <TaxonomyChips
        items={mockMeals}
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
        items={mockMeals}
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
        items={mockMeals}
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

  it('returns null when items are empty', () => {
    const { container } = render(
      <TaxonomyChips
        items={[]}
        selectedIds={[]}
        label="Meals"
        onToggle={mockOnToggle}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('handles multiple chip selections', async () => {
    const user = userEvent.setup()
    render(
      <TaxonomyChips
        items={mockMeals}
        selectedIds={[]}
        label="Meals"
        onToggle={mockOnToggle}
      />
    )

    const breakfastButton = screen.getByText('Breakfast').closest('button')!
    const lunchButton = screen.getByText('Lunch').closest('button')!

    await user.click(breakfastButton)
    expect(mockOnToggle).toHaveBeenCalledWith('m1')

    await user.click(lunchButton)
    expect(mockOnToggle).toHaveBeenCalledWith('m2')
  })

  it('displays only counts for selected items when counts provided', () => {
    render(
      <TaxonomyChips
        items={mockMeals}
        selectedIds={[]}
        label="Meals"
        onToggle={mockOnToggle}
        counts={{ m1: 5 }}
      />
    )
    expect(screen.getByText(/Breakfast/)).toHaveTextContent('(5)')
    expect(screen.queryByText(/Lunch.*\(/)).not.toBeInTheDocument()
  })
})
