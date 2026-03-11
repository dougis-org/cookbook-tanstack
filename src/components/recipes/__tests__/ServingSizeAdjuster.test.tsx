import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ServingSizeAdjuster from '@/components/recipes/ServingSizeAdjuster'

describe('ServingSizeAdjuster', () => {
  it('increments servings and updates scaled ingredients', () => {
    const onScaledIngredientsChange = vi.fn()
    render(
      <ServingSizeAdjuster
        originalServings={2}
        ingredients={['2 cups flour']}
        onScaledIngredientsChange={onScaledIngredientsChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /increase servings/i }))

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(onScaledIngredientsChange).toHaveBeenLastCalledWith(['3 cups flour'])
  })

  it('decrements servings and disables at minimum 1', () => {
    const onScaledIngredientsChange = vi.fn()
    render(
      <ServingSizeAdjuster
        originalServings={1}
        ingredients={['1 cup flour']}
        onScaledIngredientsChange={onScaledIngredientsChange}
      />,
    )

    const decrement = screen.getByRole('button', { name: /decrease servings/i })
    expect(decrement).toBeDisabled()
  })

  it('shows reset when servings changed and resets to original', () => {
    const onScaledIngredientsChange = vi.fn()
    render(
      <ServingSizeAdjuster
        originalServings={2}
        ingredients={['2 cups flour']}
        onScaledIngredientsChange={onScaledIngredientsChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /increase servings/i }))
    const reset = screen.getByRole('button', { name: /reset/i })
    fireEvent.click(reset)

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument()
  })
})
