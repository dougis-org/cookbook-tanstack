/**
 * Tests for CookbookRecipeCard components:
 * - StaticRecipeCard: image, name link, metadata, index, no owner controls
 * - SortableRecipeCard: drag handle, remove button presence/absence, aria labels
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SortableRecipeCard, StaticRecipeCard } from '@/components/cookbooks/CookbookRecipeCard'

// ─── Router mock ─────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
  }: {
    children: React.ReactNode
    to: string
    params?: Record<string, string>
  }) => <a href={to.replace('$recipeId', params?.recipeId ?? '')}>{children}</a>,
}))

// ─── DnD mocks ───────────────────────────────────────────────────────────────

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

// ─── CardImage mock ───────────────────────────────────────────────────────────

vi.mock('@/components/ui/CardImage', () => ({
  default: ({ alt, className }: { alt: string; className: string }) => (
    <div data-testid="card-image" className={className} aria-label={alt} />
  ),
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseRecipe = {
  id: 'r-1',
  name: 'Spaghetti Bolognese',
  imageUrl: 'https://example.com/pasta.jpg',
  prepTime: 20,
  cookTime: 35,
  servings: 4,
}

// ─── StaticRecipeCard ─────────────────────────────────────────────────────────

describe('StaticRecipeCard', () => {
  it('renders CardImage at h-32', () => {
    render(<StaticRecipeCard recipe={baseRecipe} index={0} />)
    const img = screen.getByTestId('card-image')
    expect(img.className).toContain('h-32')
  })

  it('renders recipe name as a link to the recipe detail page', () => {
    render(<StaticRecipeCard recipe={baseRecipe} index={0} />)
    const link = screen.getByRole('link', { name: 'Spaghetti Bolognese' })
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toContain('r-1')
  })

  it('renders metadata line when prepTime, cookTime, and servings are present', () => {
    render(<StaticRecipeCard recipe={baseRecipe} index={0} />)
    expect(screen.getByText('Prep 20m · Cook 35m · 4 servings')).toBeInTheDocument()
  })

  it('omits absent metadata fields', () => {
    render(
      <StaticRecipeCard
        recipe={{ id: 'r-2', name: 'Simple Dish', prepTime: null, cookTime: null, servings: null }}
        index={0}
      />,
    )
    expect(screen.queryByText(/Prep|Cook|servings/)).not.toBeInTheDocument()
  })

  it('renders 1-based index number', () => {
    render(<StaticRecipeCard recipe={baseRecipe} index={2} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('does not render a drag handle', () => {
    render(<StaticRecipeCard recipe={baseRecipe} index={0} />)
    expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument()
  })

  it('does not render a remove button', () => {
    render(<StaticRecipeCard recipe={baseRecipe} index={0} />)
    expect(screen.queryByLabelText(/Remove/)).not.toBeInTheDocument()
  })
})

// ─── SortableRecipeCard ───────────────────────────────────────────────────────

describe('SortableRecipeCard', () => {
  it('renders CardImage at h-32', () => {
    render(<SortableRecipeCard recipe={baseRecipe} index={0} onRemove={vi.fn()} />)
    const img = screen.getByTestId('card-image')
    expect(img.className).toContain('h-32')
  })

  it('renders recipe name as a link', () => {
    render(<SortableRecipeCard recipe={baseRecipe} index={0} onRemove={vi.fn()} />)
    expect(screen.getByRole('link', { name: 'Spaghetti Bolognese' })).toBeInTheDocument()
  })

  it('renders a drag handle button with correct aria-label', () => {
    render(<SortableRecipeCard recipe={baseRecipe} index={0} onRemove={vi.fn()} />)
    expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument()
  })

  it('renders a remove button with aria-label including recipe name', () => {
    render(<SortableRecipeCard recipe={baseRecipe} index={0} onRemove={vi.fn()} />)
    expect(screen.getByLabelText('Remove Spaghetti Bolognese')).toBeInTheDocument()
  })

  it('remove button starts hidden via opacity-0 class', () => {
    render(<SortableRecipeCard recipe={baseRecipe} index={0} onRemove={vi.fn()} />)
    const removeBtn = screen.getByLabelText('Remove Spaghetti Bolognese')
    expect(removeBtn.className).toContain('opacity-0')
    expect(removeBtn.className).toContain('group-hover:opacity-100')
  })

  it('renders 1-based index number', () => {
    render(<SortableRecipeCard recipe={baseRecipe} index={0} onRemove={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders metadata line when present', () => {
    render(<SortableRecipeCard recipe={baseRecipe} index={0} onRemove={vi.fn()} />)
    expect(screen.getByText('Prep 20m · Cook 35m · 4 servings')).toBeInTheDocument()
  })
})
