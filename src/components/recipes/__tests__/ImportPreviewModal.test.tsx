import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ImportPreviewModal from '@/components/recipes/ImportPreviewModal'

const recipe = {
  name: 'Imported Pasta',
  ingredients: '1 cup flour\n2 eggs',
  instructions: 'Mix\nCook',
  servings: 2,
  difficulty: 'easy' as const,
  _version: '0',
}

describe('ImportPreviewModal', () => {
  it('shows version mismatch warning when versions differ', () => {
    render(
      <ImportPreviewModal
        open
        recipe={recipe}
        versionMismatch
        isPending={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText(/different schema version/i)).toBeInTheDocument()
  })

  it('fires confirm and cancel handlers', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ImportPreviewModal
        open
        recipe={recipe}
        versionMismatch={false}
        isPending={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /confirm import/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
