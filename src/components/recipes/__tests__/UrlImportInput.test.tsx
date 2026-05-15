import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UrlImportInput } from '../UrlImportInput'

describe('UrlImportInput', () => {
  let onSubmit: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onSubmit = vi.fn()
  })

  function setup(props: Partial<Parameters<typeof UrlImportInput>[0]> = {}) {
    return render(
      <UrlImportInput onSubmit={onSubmit} isPending={false} {...props} />
    )
  }

  it('renders URL input and submit button', () => {
    setup()
    expect(screen.getByPlaceholderText(/url/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
  })

  it('does not call onSubmit for empty URL', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: /import/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not call onSubmit for whitespace-only URL', async () => {
    setup()
    await userEvent.type(screen.getByPlaceholderText(/url/i), '   ')
    await userEvent.click(screen.getByRole('button', { name: /import/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with trimmed URL', async () => {
    setup()
    await userEvent.type(screen.getByPlaceholderText(/url/i), '  https://example.com/recipe  ')
    await userEvent.click(screen.getByRole('button', { name: /import/i }))
    expect(onSubmit).toHaveBeenCalledWith('https://example.com/recipe')
  })

  it('disables button when isPending is true', () => {
    setup({ isPending: true })
    expect(screen.getByRole('button', { name: /import/i })).toBeDisabled()
  })

  it('shows loading state when isPending is true', () => {
    setup({ isPending: true })
    expect(screen.getByText(/loading|importing/i)).toBeInTheDocument()
  })

  it('displays error message when error prop is provided', () => {
    setup({ error: 'Failed to import recipe' })
    expect(screen.getByText('Failed to import recipe')).toBeInTheDocument()
  })

  it('hides error message when no error', () => {
    setup({ error: null })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('preserves URL input after submit so user can retry on error', async () => {
    setup()
    const input = screen.getByPlaceholderText(/url/i) as HTMLInputElement

    await userEvent.type(input, 'https://example.com/recipe')
    await userEvent.click(screen.getByRole('button', { name: /import/i }))

    expect(input.value).toBe('https://example.com/recipe')
  })
})
