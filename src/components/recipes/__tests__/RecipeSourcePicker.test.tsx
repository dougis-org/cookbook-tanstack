import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const SOURCES = [
  { id: 's-personal', name: 'Personal', slug: 'personal', url: null },
  { id: 's-bon', name: 'Bon Appetit', slug: 'bon-appetit', url: null },
]

vi.mock('@/lib/trpc', () => ({
  trpc: {
    sources: {
      byId: {
        queryOptions: ({ id }: { id: string }) => ({
          queryKey: ['sources', 'byId', id],
          queryFn: () => SOURCES.find((s) => s.id === id) ?? null,
        }),
      },
      listPage: {
        queryOptions: ({ cursor }: { cursor: number }) => ({
          queryKey: ['sources', 'listPage', cursor],
          queryFn: () => ({ items: SOURCES, nextCursor: null }),
        }),
      },
      search: {
        queryOptions: ({ query }: { query: string }) => ({
          queryKey: ['sources', 'search', query],
          queryFn: () =>
            SOURCES.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())),
        }),
      },
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

import RecipeSourcePicker from '../RecipeSourcePicker'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function StatefulPicker({
  onChange,
  onPersonalSourceNameChange,
}: {
  onChange?: (id: string) => void
  onPersonalSourceNameChange?: (v: string) => void
}) {
  const [value, setValue] = React.useState('')
  const [personalName, setPersonalName] = React.useState('')
  return (
    <RecipeSourcePicker
      value={value}
      onChange={(id) => {
        setValue(id)
        onChange?.(id)
      }}
      personalSourceName={personalName}
      onPersonalSourceNameChange={(v) => {
        setPersonalName(v)
        onPersonalSourceNameChange?.(v)
      }}
    />
  )
}

function renderPicker(
  props: Partial<{
    value: string
    initialName: string
    onChange: (id: string) => void
    personalSourceName: string
    onPersonalSourceNameChange: (v: string) => void
  }> = {},
) {
  return renderWithProviders(
    <RecipeSourcePicker
      value={props.value ?? ''}
      initialName={props.initialName}
      onChange={props.onChange ?? vi.fn()}
      personalSourceName={props.personalSourceName ?? ''}
      onPersonalSourceNameChange={props.onPersonalSourceNameChange ?? vi.fn()}
    />,
  )
}

function openPicker() {
  fireEvent.click(screen.getByRole('button', { name: /select a source/i }))
}

async function openAddSourceModal(searchText?: string) {
  openPicker()
  if (searchText) {
    await userEvent.type(screen.getByRole('searchbox'), searchText)
  }
  await userEvent.click(screen.getByRole('button', { name: /add new source/i }))
  return screen.findByLabelText(/^name$/i) as Promise<HTMLInputElement>
}

describe('RecipeSourcePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reveals the Personal Name field when the personal source is selected', async () => {
    renderPicker()

    openPicker()
    const option = await screen.findByText('Personal')
    await userEvent.click(option)

    await waitFor(() => {
      expect(screen.getByLabelText(/personal name/i)).toBeInTheDocument()
    })
    const input = screen.getByLabelText(/personal name/i) as HTMLInputElement
    expect(input.placeholder).toBe('e.g. Aunt Mary')
    expect(input).toHaveAttribute('maxLength', '80')
    expect(screen.getByText('Only you can see this.')).toBeInTheDocument()
  })

  it('hides the Personal Name field when a non-personal source is selected', async () => {
    renderWithProviders(<StatefulPicker />)

    openPicker()
    const personalOption = await screen.findByText('Personal')
    await userEvent.click(personalOption)
    await waitFor(() => expect(screen.getByLabelText(/personal name/i)).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Personal' }))
    const bonOption = await screen.findByText('Bon Appetit')
    await userEvent.click(bonOption)

    await waitFor(() => {
      expect(screen.queryByLabelText(/personal name/i)).not.toBeInTheDocument()
    })
  })

  it('invokes onPersonalSourceNameChange when typing in the personal name field', async () => {
    const onPersonalSourceNameChange = vi.fn()
    renderPicker({ value: 's-personal', initialName: 'Personal', onPersonalSourceNameChange })

    await waitFor(() => expect(screen.getByLabelText(/personal name/i)).toBeInTheDocument())
    const input = screen.getByLabelText(/personal name/i)
    await userEvent.type(input, "Grandma's recipe book")

    expect(onPersonalSourceNameChange).toHaveBeenCalled()
  })

  it('does not invoke onPersonalSourceNameChange with an empty string when clearing the source', async () => {
    const onPersonalSourceNameChange = vi.fn()
    const onChange = vi.fn()
    renderPicker({
      value: 's-personal',
      initialName: 'Personal',
      onChange,
      personalSourceName: 'Aunt Mary',
      onPersonalSourceNameChange,
    })

    await waitFor(() => expect(screen.getByLabelText(/personal name/i)).toBeInTheDocument())
    const clearButton = screen.getByLabelText('Clear option')
    await userEvent.click(clearButton)

    expect(onChange).toHaveBeenLastCalledWith('')
    expect(onPersonalSourceNameChange).not.toHaveBeenCalledWith('')
  })

  it('follows the same click-to-open/sorted dropdown pattern as CategoryPickerDropdown', () => {
    renderPicker()
    const trigger = screen.getByRole('button', { name: /select a source/i })
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    fireEvent.click(trigger)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('renders "Add New Source" outside the dropdown listbox/popover DOM subtree', () => {
    renderPicker()
    openPicker()
    const addButton = screen.getByRole('button', { name: /add new source/i })
    const listbox = screen.getByRole('listbox')
    expect(listbox.contains(addButton)).toBe(false)
  })

  it('opens AddSourceModal pre-filled with typed search text when "Add New Source" is activated', async () => {
    renderPicker()
    const modalNameInput = await openAddSourceModal('Bon Appetit Magazine')
    expect(modalNameInput.value).toBe('Bon Appetit Magazine')
  })

  it('pre-fills the creation modal empty after the search text is cleared', async () => {
    renderPicker()
    openPicker()
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'Bon Appetit Magazine')
    await userEvent.clear(searchInput)
    await userEvent.click(screen.getByRole('button', { name: /add new source/i }))

    const modalNameInput = await screen.findByLabelText(/^name$/i)
    expect((modalNameInput as HTMLInputElement).value).toBe('')
  })

  it('creating a source via the modal selects it in the picker and closes the modal', async () => {
    renderWithProviders(<StatefulPicker />)
    const modalNameInput = await openAddSourceModal()
    await userEvent.type(modalNameInput, 'Fresh Source')
    await userEvent.click(screen.getByRole('button', { name: /^create source$/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Fresh Source' })).toBeInTheDocument()
  })
})
