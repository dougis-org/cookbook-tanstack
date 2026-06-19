import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@/lib/trpc', () => ({
  trpc: {
    sources: {
      byId: {
        queryOptions: ({ id }: { id: string }) => ({
          queryKey: ['sources', 'byId', id],
          queryFn: () => {
            if (id === 's-personal') {
              return { id: 's-personal', name: 'Personal', slug: 'personal', url: null }
            }
            if (id === 's-bon') {
              return { id: 's-bon', name: 'Bon Appetit', slug: 'bon-appetit', url: 'https://bonappetit.com' }
            }
            return null
          },
        }),
      },
      search: {
        queryOptions: ({ query }: { query: string }) => ({
          queryKey: ['sources', 'search', query],
          queryFn: () => {
            const q = query.toLowerCase()
            const all = [
              { id: 's-personal', name: 'Personal', slug: 'personal', url: null },
              { id: 's-bon', name: 'Bon Appetit', slug: 'bon-appetit', url: 'https://bonappetit.com' },
            ]
            return all.filter((s) => s.name.toLowerCase().includes(q))
          },
        }),
      },
      create: {
        mutationOptions: (options?: any) => ({
          mutationFn: async (input: { name: string }) => {
            const source = { id: 's-new', name: input.name, slug: 'new-slug', url: null }
            if (options?.onSuccess) {
              options.onSuccess(source)
            }
            return source
          },
        }),
      },
    },
  },
}))

import SourceSelector from '../SourceSelector'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function TestWrapper({
  initialValue = 's-personal',
  initialPersonalName = 'Aunt Mary',
  onChange = vi.fn(),
  onPersonalSourceNameChange = vi.fn(),
}: {
  initialValue?: string
  initialPersonalName?: string
  onChange?: (val: string) => void
  onPersonalSourceNameChange?: (val: string) => void
}) {
  const [value, setValue] = React.useState(initialValue)
  const [personalName, setPersonalName] = React.useState(initialPersonalName)
  
  return (
    <SourceSelector
      value={value}
      initialName="Personal"
      onChange={(val) => {
        setValue(val)
        onChange(val)
      }}
      personalSourceName={personalName}
      onPersonalSourceNameChange={(val) => {
        setPersonalName(val)
        onPersonalSourceNameChange(val)
      }}
    />
  )
}

describe('SourceSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render "Personal Name" input initially when no source is selected', () => {
    renderWithProviders(
      <SourceSelector
        value=""
        onChange={vi.fn()}
        personalSourceName=""
        onPersonalSourceNameChange={vi.fn()}
      />,
    )
    expect(screen.queryByLabelText(/personal name/i)).not.toBeInTheDocument()
  })

  it('renders the "Personal Name" input group when a source with slug "personal" is selected', async () => {
    renderWithProviders(
      <SourceSelector
        value="s-personal"
        initialName="Personal"
        onChange={vi.fn()}
        personalSourceName="Aunt Mary"
        onPersonalSourceNameChange={vi.fn()}
      />,
    )

    // Wait for the query to resolve and check for the label/input
    await waitFor(() => {
      expect(screen.getByLabelText(/personal name/i)).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/personal name/i) as HTMLInputElement
    expect(input.value).toBe('Aunt Mary')
    expect(input.placeholder).toBe('e.g. Aunt Mary')
    expect(input).toHaveAttribute('maxLength', '80')

    const helperText = screen.getByText('Only you can see this.')
    expect(helperText).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-describedby', helperText.id)
  })

  it('does not render the input group when a non-personal source is selected', async () => {
    renderWithProviders(
      <SourceSelector
        value="s-bon"
        initialName="Bon Appetit"
        onChange={vi.fn()}
        personalSourceName=""
        onPersonalSourceNameChange={vi.fn()}
      />,
    )

    // Wait for the query state to be processed stably without raw timers
    await waitFor(() => {
      expect(screen.queryByLabelText(/personal name/i)).not.toBeInTheDocument()
    })
  })

  it('calls onPersonalSourceNameChange when typing in the input', async () => {
    const onPersonalSourceNameChange = vi.fn()
    renderWithProviders(
      <TestWrapper
        initialPersonalName=""
        onPersonalSourceNameChange={onPersonalSourceNameChange}
      />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/personal name/i)).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/personal name/i)
    await userEvent.type(input, 'Grandma')

    expect(onPersonalSourceNameChange).toHaveBeenCalled()
    expect(onPersonalSourceNameChange).toHaveBeenLastCalledWith('Grandma')
  })

  it('does not clear personalSourceName on source selection change', async () => {
    const onPersonalSourceNameChange = vi.fn()
    const onChange = vi.fn()

    renderWithProviders(
      <TestWrapper
        onChange={onChange}
        onPersonalSourceNameChange={onPersonalSourceNameChange}
      />,
    )
    
    await waitFor(() => {
      expect(screen.getByLabelText(/personal name/i)).toBeInTheDocument()
    })
    
    const clearButton = screen.getByRole('button')
    await userEvent.click(clearButton)
    
    const input = screen.getByPlaceholderText(/search for a source/i)
    await userEvent.type(input, 'Bon')
    
    const option = await screen.findByText('Bon Appetit')
    await userEvent.click(option)
    
    expect(onChange).toHaveBeenLastCalledWith('s-bon')
    expect(onPersonalSourceNameChange).not.toHaveBeenCalledWith('')
  })

  it('does not clear personalSourceName when clearing source', async () => {
    const onPersonalSourceNameChange = vi.fn()
    const onChange = vi.fn()

    renderWithProviders(
      <TestWrapper
        onChange={onChange}
        onPersonalSourceNameChange={onPersonalSourceNameChange}
      />,
    )
    
    await waitFor(() => {
      expect(screen.getByLabelText(/personal name/i)).toBeInTheDocument()
    })
    
    const clearButton = screen.getByRole('button')
    await userEvent.click(clearButton)
    
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(onPersonalSourceNameChange).not.toHaveBeenCalledWith('')
  })
})

