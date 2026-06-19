import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const mockQueryFn = vi.hoisted(() => vi.fn().mockImplementation(() => [
  { id: 'c1', name: 'Appetizer' },
  { id: 'c2', name: 'Main Course' },
  { id: 'c3', name: 'Dessert' },
]))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    classifications: {
      list: {
        queryOptions: () => ({
          queryKey: ['classifications', 'list'],
          queryFn: mockQueryFn,
        }),
      },
    },
  },
}))

import CategoryPickerDropdown from '../CategoryPickerDropdown'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('CategoryPickerDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('trigger display', () => {
    it('shows placeholder when no value selected and does not query on mount', () => {
      renderWithProviders(<CategoryPickerDropdown value="" onChange={vi.fn()} />)
      expect(screen.getByRole('button')).toHaveTextContent('Select a category…')
      expect(mockQueryFn).not.toHaveBeenCalled()
    })

    it('shows custom placeholder when provided and does not query on mount', () => {
      renderWithProviders(
        <CategoryPickerDropdown value="" onChange={vi.fn()} placeholder="Pick category" />,
      )
      expect(screen.getByRole('button')).toHaveTextContent('Pick category')
      expect(mockQueryFn).not.toHaveBeenCalled()
    })

    it('shows selected category name when value and selectedName are provided and does not query on mount', () => {
      renderWithProviders(
        <CategoryPickerDropdown value="c1" selectedName="Appetizer" onChange={vi.fn()} />,
      )
      expect(screen.getByRole('button', { name: /appetizer/i })).toBeInTheDocument()
      expect(mockQueryFn).not.toHaveBeenCalled()
    })
  })

  describe('panel open/close', () => {
    it('opens the panel on trigger click and triggers classifications query', async () => {
      renderWithProviders(<CategoryPickerDropdown value="" onChange={vi.fn()} />)
      expect(mockQueryFn).not.toHaveBeenCalled()

      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('searchbox')).toBeInTheDocument()

      await waitFor(() => {
        expect(mockQueryFn).toHaveBeenCalled()
      })
    })

    it('closes the panel when Escape is pressed', async () => {
      renderWithProviders(<CategoryPickerDropdown value="" onChange={vi.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('searchbox')).toBeInTheDocument()
      await userEvent.keyboard('{Escape}')
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })
  })

  describe('category list', () => {
    it('shows all categories when panel is opened', async () => {
      renderWithProviders(<CategoryPickerDropdown value="" onChange={vi.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getByText('Appetizer')).toBeInTheDocument()
        expect(screen.getByText('Main Course')).toBeInTheDocument()
        expect(screen.getByText('Dessert')).toBeInTheDocument()
      })
    })

    it('filters the list when user types in the search input', async () => {
      renderWithProviders(<CategoryPickerDropdown value="" onChange={vi.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      await userEvent.type(screen.getByRole('searchbox'), 'dess')
      await waitFor(() => {
        expect(screen.getByText('Dessert')).toBeInTheDocument()
        expect(screen.queryByText('Appetizer')).not.toBeInTheDocument()
      })
    })
  })

  describe('selection', () => {
    it('calls onChange with id and name when a category is selected', async () => {
      const onChange = vi.fn()
      renderWithProviders(<CategoryPickerDropdown value="" onChange={onChange} />)
      await userEvent.click(screen.getByRole('button'))
      await waitFor(() => screen.getByText('Dessert'))
      await userEvent.click(screen.getByText('Dessert'))
      expect(onChange).toHaveBeenCalledWith('c3', 'Dessert')
    })
  })
})
