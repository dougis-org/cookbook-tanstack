import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UrlImportInput } from '../UrlImportInput'

describe('UrlImportInput', () => {
  it('renders URL input and submit button', () => {
    const onSubmit = vi.fn()
    render(
      <UrlImportInput onSubmit={onSubmit} isPending={false} />
    )

    expect(screen.getByPlaceholderText(/url/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
  })

  it('does not call onSubmit for empty URL', async () => {
    const onSubmit = vi.fn()
    render(
      <UrlImportInput onSubmit={onSubmit} isPending={false} />
    )

    const button = screen.getByRole('button', { name: /import/i })
    await userEvent.click(button)

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not call onSubmit for whitespace-only URL', async () => {
    const onSubmit = vi.fn()
    render(
      <UrlImportInput onSubmit={onSubmit} isPending={false} />
    )

    const input = screen.getByPlaceholderText(/url/i) as HTMLInputElement
    await userEvent.type(input, '   ')

    const button = screen.getByRole('button', { name: /import/i })
    await userEvent.click(button)

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with trimmed URL', async () => {
    const onSubmit = vi.fn()
    render(
      <UrlImportInput onSubmit={onSubmit} isPending={false} />
    )

    const input = screen.getByPlaceholderText(/url/i) as HTMLInputElement
    await userEvent.type(input, '  https://example.com/recipe  ')

    const button = screen.getByRole('button', { name: /import/i })
    await userEvent.click(button)

    expect(onSubmit).toHaveBeenCalledWith('https://example.com/recipe')
  })

  it('disables button when isPending is true', () => {
    const onSubmit = vi.fn()
    render(
      <UrlImportInput onSubmit={onSubmit} isPending={true} />
    )

    const button = screen.getByRole('button', { name: /import/i })
    expect(button).toBeDisabled()
  })

  it('shows loading state when isPending is true', () => {
    const onSubmit = vi.fn()
    render(
      <UrlImportInput onSubmit={onSubmit} isPending={true} />
    )

    expect(screen.getByText(/loading|importing/i)).toBeInTheDocument()
  })

  it('displays error message when error prop is provided', () => {
    const onSubmit = vi.fn()
    render(
      <UrlImportInput
        onSubmit={onSubmit}
        isPending={false}
        error="Failed to import recipe"
      />
    )

    expect(screen.getByText('Failed to import recipe')).toBeInTheDocument()
  })

  it('hides error message when no error', () => {
    const onSubmit = vi.fn()
    render(
      <UrlImportInput
        onSubmit={onSubmit}
        isPending={false}
        error={null}
      />
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('clears URL input after successful submit', async () => {
    const onSubmit = vi.fn()
    const { rerender } = render(
      <UrlImportInput onSubmit={onSubmit} isPending={false} />
    )

    const input = screen.getByPlaceholderText(/url/i) as HTMLInputElement
    await userEvent.type(input, 'https://example.com/recipe')

    expect(input.value).toBe('https://example.com/recipe')

    const button = screen.getByRole('button', { name: /import/i })
    await userEvent.click(button)

    // Simulate component re-render with new state
    rerender(
      <UrlImportInput onSubmit={onSubmit} isPending={false} />
    )

    const inputAfter = screen.getByPlaceholderText(/url/i) as HTMLInputElement
    expect(inputAfter.value).toBe('')
  })
})
