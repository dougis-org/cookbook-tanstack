import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/trpc', () => ({
  trpc: {
    sources: {
      list: {
        queryOptions: () => ({
          queryKey: ['sources', 'list'],
          queryFn: () => [
            { id: 's1', name: 'Bon Appétit', url: 'https://bonappetit.com' },
            { id: 's2', name: 'Serious Eats', url: null },
            { id: 's3', name: 'NYT Cooking', url: null },
          ],
        }),
      },
      search: {
        queryOptions: ({ query }: { query: string }) => ({
          queryKey: ['sources', 'search', query],
          queryFn: () => {
            const q = query.toLowerCase()
            return [
              { id: 's1', name: 'Bon Appétit', url: null },
              { id: 's2', name: 'Serious Eats', url: null },
              { id: 's3', name: 'NYT Cooking', url: null },
            ].filter((s) => s.name.toLowerCase().includes(q))
          },
        }),
      },
    },
  },
}))

import SourcePickerDropdown from '../SourcePickerDropdown'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('SourcePickerDropdown', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('trigger display', () => {
    it('shows placeholder when no value selected', () => {
      renderWithProviders(<SourcePickerDropdown value="" onChange={vi.fn()} />)
      expect(screen.getByRole('button')).toHaveTextContent('Select a source…')
    })

    it('shows custom placeholder when provided', () => {
      renderWithProviders(
        <SourcePickerDropdown value="" onChange={vi.fn()} placeholder="Pick source" />,
      )
      expect(screen.getByRole('button')).toHaveTextContent('Pick source')
    })

    it('shows selected source name when value and selectedName are provided', () => {
      renderWithProviders(
        <SourcePickerDropdown value="s1" selectedName="Bon Appétit" onChange={vi.fn()} />,
      )
      expect(screen.getByRole('button', { name: /bon appétit/i })).toBeInTheDocument()
    })
  })

  describe('panel open/close', () => {
    it('opens the panel on trigger click', async () => {
      renderWithProviders(<SourcePickerDropdown value="" onChange={vi.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('searchbox')).toBeInTheDocument()
    })

    it('closes the panel when Escape is pressed', async () => {
      renderWithProviders(<SourcePickerDropdown value="" onChange={vi.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('searchbox')).toBeInTheDocument()
      await userEvent.keyboard('{Escape}')
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })

    it('closes the panel when clicking outside', async () => {
      renderWithProviders(
        <div>
          <SourcePickerDropdown value="" onChange={vi.fn()} />
          <button data-testid="outside">Outside</button>
        </div>,
      )
      await userEvent.click(screen.getByRole('button', { name: /select a source/i }))
      expect(screen.getByRole('searchbox')).toBeInTheDocument()
      await userEvent.click(screen.getByTestId('outside'))
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })
  })

  describe('source list', () => {
    it('shows all sources when panel is opened with no search', async () => {
      renderWithProviders(<SourcePickerDropdown value="" onChange={vi.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getByText('Bon Appétit')).toBeInTheDocument()
        expect(screen.getByText('Serious Eats')).toBeInTheDocument()
        expect(screen.getByText('NYT Cooking')).toBeInTheDocument()
      })
    })

    it('filters the list when user types in the search input', async () => {
      renderWithProviders(<SourcePickerDropdown value="" onChange={vi.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      await userEvent.type(screen.getByRole('searchbox'), 'eats')
      await waitFor(() => {
        expect(screen.getByText('Serious Eats')).toBeInTheDocument()
        expect(screen.queryByText('Bon Appétit')).not.toBeInTheDocument()
      })
    })

    it('shows empty state when no sources match the search', async () => {
      renderWithProviders(<SourcePickerDropdown value="" onChange={vi.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      await userEvent.type(screen.getByRole('searchbox'), 'zzz')
      await waitFor(() => {
        expect(screen.getByText(/no sources found/i)).toBeInTheDocument()
      })
    })
  })

  describe('selection', () => {
    it('calls onChange with id and name when a source is selected', async () => {
      const onChange = vi.fn()
      renderWithProviders(<SourcePickerDropdown value="" onChange={onChange} />)
      await userEvent.click(screen.getByRole('button'))
      await waitFor(() => screen.getByText('Serious Eats'))
      await userEvent.click(screen.getByText('Serious Eats'))
      expect(onChange).toHaveBeenCalledWith('s2', 'Serious Eats')
    })

    it('closes the panel after selecting a source', async () => {
      renderWithProviders(<SourcePickerDropdown value="" onChange={vi.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      await waitFor(() => screen.getByText('Serious Eats'))
      await userEvent.click(screen.getByText('Serious Eats'))
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })
  })

  describe('clear', () => {
    it('shows a clear button when a source is selected', () => {
      renderWithProviders(
        <SourcePickerDropdown value="s1" selectedName="Bon Appétit" onChange={vi.fn()} />,
      )
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('does not show a clear button when no source is selected', () => {
      renderWithProviders(<SourcePickerDropdown value="" onChange={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
    })

    it('calls onChange with empty string when clear is clicked', async () => {
      const onChange = vi.fn()
      renderWithProviders(
        <SourcePickerDropdown value="s1" selectedName="Bon Appétit" onChange={onChange} />,
      )
      await userEvent.click(screen.getByRole('button', { name: /clear/i }))
      expect(onChange).toHaveBeenCalledWith('', '')
    })
  })
})
