import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterRow1Quick } from '../FilterRow1Quick'

describe('FilterRow1Quick', () => {
  const mockUpdateSearch = vi.fn()

  beforeEach(() => {
    mockUpdateSearch.mockClear()
  })

  it('renders Has Image toggle always', () => {
    render(
      <FilterRow1Quick
        myRecipes={false}
        markedByMe={false}
        hasImage={false}
        isLoggedIn={false}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByText('Has Image')).toBeInTheDocument()
  })

  it('shows My Recipes and Favorites toggles when logged in', () => {
    render(
      <FilterRow1Quick
        myRecipes={false}
        markedByMe={false}
        hasImage={false}
        isLoggedIn={true}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByText('My Recipes')).toBeInTheDocument()
    expect(screen.getByText('Favorites')).toBeInTheDocument()
    expect(screen.getByText('Has Image')).toBeInTheDocument()
  })

  it('hides My Recipes and Favorites toggles when not logged in', () => {
    render(
      <FilterRow1Quick
        myRecipes={false}
        markedByMe={false}
        hasImage={false}
        isLoggedIn={false}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.queryByText('My Recipes')).not.toBeInTheDocument()
    expect(screen.queryByText('Favorites')).not.toBeInTheDocument()
  })

  it('toggles My Recipes filter on click', async () => {
    const user = userEvent.setup()
    render(
      <FilterRow1Quick
        myRecipes={false}
        markedByMe={false}
        hasImage={false}
        isLoggedIn={true}
        updateSearch={mockUpdateSearch}
      />
    )
    const button = screen.getByText('My Recipes').closest('button')!
    await user.click(button)
    expect(mockUpdateSearch).toHaveBeenCalledWith({ myRecipes: true })
  })

  it('toggles Favorites filter on click', async () => {
    const user = userEvent.setup()
    render(
      <FilterRow1Quick
        myRecipes={false}
        markedByMe={false}
        hasImage={false}
        isLoggedIn={true}
        updateSearch={mockUpdateSearch}
      />
    )
    const button = screen.getByText('Favorites').closest('button')!
    await user.click(button)
    expect(mockUpdateSearch).toHaveBeenCalledWith({ markedByMe: true })
  })

  it('toggles Has Image filter on click', async () => {
    const user = userEvent.setup()
    render(
      <FilterRow1Quick
        myRecipes={false}
        markedByMe={false}
        hasImage={false}
        isLoggedIn={false}
        updateSearch={mockUpdateSearch}
      />
    )
    const button = screen.getByText('Has Image').closest('button')!
    await user.click(button)
    expect(mockUpdateSearch).toHaveBeenCalledWith({ hasImage: true })
  })

  it('deactivates My Recipes when clicked while active', async () => {
    const user = userEvent.setup()
    render(
      <FilterRow1Quick
        myRecipes={true}
        markedByMe={false}
        hasImage={false}
        isLoggedIn={true}
        updateSearch={mockUpdateSearch}
      />
    )
    const button = screen.getByText('My Recipes').closest('button')!
    await user.click(button)
    expect(mockUpdateSearch).toHaveBeenCalledWith({ myRecipes: undefined })
  })

  it('displays active state with cyan styling', () => {
    const { container } = render(
      <FilterRow1Quick
        myRecipes={true}
        markedByMe={false}
        hasImage={true}
        isLoggedIn={true}
        updateSearch={mockUpdateSearch}
      />
    )
    const buttons = container.querySelectorAll('button')
    
    // My Recipes button should be active
    const myRecipesButton = Array.from(buttons).find(btn => btn.textContent.includes('My Recipes'))
    expect(myRecipesButton).toHaveClass('bg-cyan-500/20', 'border-cyan-500', 'text-cyan-300')
    
    // Has Image button should be active
    const hasImageButton = Array.from(buttons).find(btn => btn.textContent.includes('Has Image'))
    expect(hasImageButton).toHaveClass('bg-cyan-500/20', 'border-cyan-500', 'text-cyan-300')
  })

  it('displays inactive state with slate styling', () => {
    const { container } = render(
      <FilterRow1Quick
        myRecipes={false}
        markedByMe={false}
        hasImage={false}
        isLoggedIn={true}
        updateSearch={mockUpdateSearch}
      />
    )
    const buttons = container.querySelectorAll('button')
    
    // My Recipes button should be inactive
    const myRecipesButton = Array.from(buttons).find(btn => btn.textContent.includes('My Recipes'))
    expect(myRecipesButton).toHaveClass('bg-slate-800', 'border-slate-700', 'text-gray-400')
  })
})
