import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const invalidateQueries = vi.fn()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  )
  return {
    ...actual,
    useQueryClient: () => ({
      ...new actual.QueryClient(),
      invalidateQueries,
    }),
  }
})

vi.mock('@/lib/trpc', () => ({
  trpc: {
    sources: {
      create: {
        mutationOptions: (options?: any) => ({
          mutationFn: async (input: { name: string; url?: string }) => {
            const source = { id: 's-new', name: input.name, slug: 'new-slug', url: null }
            if (options?.onSuccess) options.onSuccess(source)
            return source
          },
        }),
      },
    },
  },
}))

import AddSourceModal from '../AddSourceModal'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('AddSourceModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pre-fills the name field from the initialName prop', () => {
    renderWithProviders(
      <AddSourceModal initialName="Bon Appetit Magazine" onClose={vi.fn()} onCreated={vi.fn()} />,
    )
    const nameInput = screen.getByLabelText(/^name$/i) as HTMLInputElement
    expect(nameInput.value).toBe('Bon Appetit Magazine')
  })

  it('submits a valid name, invalidates source caches, and reports the created source', async () => {
    const onCreated = vi.fn()
    const onClose = vi.fn()
    renderWithProviders(
      <AddSourceModal initialName="" onClose={onClose} onCreated={onCreated} />,
    )

    await userEvent.type(screen.getByLabelText(/^name$/i), 'My New Source')
    await userEvent.click(screen.getByRole('button', { name: /create source/i }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith({ id: 's-new', name: 'My New Source' })
    })
    expect(invalidateQueries).toHaveBeenCalled()
  })

  it('has a Cancel button that calls onClose', async () => {
    const onClose = vi.fn()
    renderWithProviders(<AddSourceModal onClose={onClose} onCreated={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('pressing Enter while focused on the Cancel button does not submit', async () => {
    const onClose = vi.fn()
    const onCreated = vi.fn()
    renderWithProviders(
      <AddSourceModal initialName="Some Source" onClose={onClose} onCreated={onCreated} />,
    )
    screen.getByRole('button', { name: /cancel/i }).focus()
    await userEvent.keyboard('{Enter}')
    expect(onCreated).not.toHaveBeenCalled()
  })
})
