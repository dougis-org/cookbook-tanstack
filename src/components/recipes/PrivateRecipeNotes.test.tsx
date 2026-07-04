import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// --- hoisted mock variables ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockGetFn: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockUpsertFn: any
let canUseNotes: boolean
let isLoggedIn: boolean

vi.mock('@/lib/trpc', () => ({
  trpc: {
    privateRecipeNotes: {
      get: {
        queryOptions: ({ recipeId }: { recipeId: string }) => ({
          queryKey: ['privateRecipeNotes', 'get', recipeId],
          queryFn: () => mockGetFn(),
        }),
      },
      upsert: {
        mutationOptions: (opts?: Record<string, unknown>) => ({
          mutationFn: (input: { recipeId: string; body: string }) => mockUpsertFn(input),
          ...(opts ?? {}),
        }),
      },
    },
  },
}))

vi.mock('@/hooks/useTierEntitlements', () => ({
  useTierEntitlements: () => ({ canUsePrivateRecipeNotes: canUseNotes }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isLoggedIn }),
}))

vi.mock('@/components/recipes/RecipeNotesUpgradeNudge', () => ({
  default: ({ state }: { state: string }) => <div data-testid={`nudge-${state}`} />,
}))

import PrivateRecipeNotes from '@/components/recipes/PrivateRecipeNotes'

const RECIPE_ID = 'abc123'
const NOTE_QUERY_KEY = ['privateRecipeNotes', 'get', RECIPE_ID]

function makeNote(body: string) {
  return { hasNote: true, note: { body, updatedAt: new Date() } }
}

const emptyNoteData = { hasNote: false, note: null }

let queryClient: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function renderComponent() {
  return render(<PrivateRecipeNotes recipeId={RECIPE_ID} />, { wrapper })
}

function seedQueryClient(data: unknown) {
  queryClient.setQueryData(NOTE_QUERY_KEY, data)
}

const openAddNote = async () => {
  seedQueryClient(emptyNoteData)
  renderComponent()
  await waitFor(() => expect(screen.getByRole('button', { name: /add a note/i })).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /add a note/i }))
}

const openEditNote = async (body: string) => {
  seedQueryClient(makeNote(body))
  renderComponent()
  await waitFor(() => expect(screen.getByText(body)).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /edit note/i }))
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  })
  canUseNotes = true
  isLoggedIn = true
  // default emptyNoteData; override per-test when post-success refetch must return updated data
  mockGetFn = vi.fn().mockResolvedValue(emptyNoteData)
  mockUpsertFn = vi.fn().mockResolvedValue({ success: true })
})

describe('PrivateRecipeNotes', () => {
  describe('render branches', () => {
    it('Branch 1 — anonymous: shows anonymous nudge and fires no query', () => {
      isLoggedIn = false
      canUseNotes = false
      renderComponent()
      expect(screen.getByTestId('nudge-anonymous')).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(mockGetFn).not.toHaveBeenCalled()
    })

    it('Branch 2 — below-tier with no note: shows below-tier nudge, no textarea', async () => {
      isLoggedIn = true
      canUseNotes = false
      seedQueryClient({ hasNote: false, note: null })
      renderComponent()
      await waitFor(() => expect(screen.getByTestId('nudge-below-tier')).toBeInTheDocument())
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('Branch 3 — below-tier with existing note (downgrade): shows hidden-by-downgrade nudge, no note body', async () => {
      isLoggedIn = true
      canUseNotes = false
      seedQueryClient({ hasNote: true, note: null })
      renderComponent()
      await waitFor(() => expect(screen.getByTestId('nudge-hidden-by-downgrade')).toBeInTheDocument())
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('Branch 4 — entitled user with existing note: shows note body, no nudge', async () => {
      isLoggedIn = true
      canUseNotes = true
      seedQueryClient(makeNote('My private note'))
      renderComponent()
      await waitFor(() => expect(screen.getByText('My private note')).toBeInTheDocument())
      expect(screen.queryByTestId(/^nudge-/)).not.toBeInTheDocument()
    })
  })

  describe('below-tier loading state', () => {
    it('renders nothing (not skeleton) while hasNote is loading for below-tier user', async () => {
      isLoggedIn = true
      canUseNotes = false
      mockGetFn.mockImplementation(() => new Promise(() => undefined))
      const { container } = renderComponent()
      await waitFor(() => expect(container).toBeEmptyDOMElement())
      expect(screen.queryByTestId('private-notes-skeleton')).not.toBeInTheDocument()
      expect(screen.queryByTestId(/^nudge-/)).not.toBeInTheDocument()
    })
  })

  describe('query error state', () => {
    it('renders null when query fails to avoid misleading empty state', async () => {
      mockGetFn.mockRejectedValue(new Error('Network error'))
      const { container } = renderComponent()
      await waitFor(() => expect(container).toBeEmptyDOMElement())
    })
  })

  describe('loading skeleton', () => {
    it('renders skeleton while query is in flight', async () => {
      mockGetFn.mockImplementation(() => new Promise(() => {}))
      renderComponent()
      await waitFor(() =>
        expect(screen.getByTestId('private-notes-skeleton')).toBeInTheDocument(),
      )
    })
  })

  describe('empty state', () => {
    it('shows Private Notes heading and Add a note button when no note exists', async () => {
      seedQueryClient(emptyNoteData)
      renderComponent()
      await waitFor(() => expect(screen.getByText('Private Notes')).toBeInTheDocument())
      expect(screen.getByRole('button', { name: /add a note/i })).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })

  describe('read mode with note', () => {
    it('displays saved note body and edit button', async () => {
      seedQueryClient(makeNote('My note text'))
      renderComponent()
      await waitFor(() => expect(screen.getByText('My note text')).toBeInTheDocument())
      expect(screen.getByRole('button', { name: /edit note/i })).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })

  describe('edit mode', () => {
    it('clicking edit shows textarea with body value and counter', async () => {
      await openEditNote('Existing text')

      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
      expect((textarea as HTMLTextAreaElement).value).toBe('Existing text')
      expect(screen.getByText('13 / 10000')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('clicking Add a note shows empty textarea', async () => {
      await openAddNote()

      const textarea = screen.getByRole('textbox')
      expect((textarea as HTMLTextAreaElement).value).toBe('')
      expect(screen.getByText('0 / 10000')).toBeInTheDocument()
    })
  })

  describe('character counter', () => {
    it('updates counter as user types', async () => {
      await openAddNote()
      const textarea = screen.getByRole('textbox')

      fireEvent.change(textarea, { target: { value: 'Hello' } })
      expect(screen.getByText('5 / 10000')).toBeInTheDocument()

      fireEvent.change(textarea, { target: { value: 'Hello World' } })
      expect(screen.getByText('11 / 10000')).toBeInTheDocument()
    })
  })

  describe('Save button disabled states', () => {
    it('Save is disabled when body is unchanged', async () => {
      await openEditNote('Original text')
      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
    })

    it('Save is enabled after editing', async () => {
      await openEditNote('Original text')
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Changed text' } })
      expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled()
    })

    it('Save is disabled when empty note textarea is empty', async () => {
      await openAddNote()
      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
    })
  })

  describe('Save success', () => {
    it('calls upsert and returns to read mode with updated text', async () => {
      mockGetFn.mockResolvedValue(makeNote('Updated text'))
      await openEditNote('Original text')
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Updated text' } })
      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() =>
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument(),
      )

      expect(mockUpsertFn).toHaveBeenCalledWith({
        recipeId: RECIPE_ID,
        body: 'Updated text',
      })
      expect(screen.getByText('Updated text')).toBeInTheDocument()
    })
  })

  describe('Save disabled while pending', () => {
    it('Save and Cancel buttons are disabled while mutation is in flight', async () => {
      mockUpsertFn.mockImplementation(() => new Promise(() => {}))
      await openEditNote('Original text')
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Changed' } })
      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /save/i })).toBeDisabled(),
      )
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    })
  })

  describe('Save failure and rollback', () => {
    it('shows error message and stays in edit mode on save failure', async () => {
      mockUpsertFn.mockRejectedValue(new Error('Server error'))
      await openEditNote('Original text')
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Changed text' } })
      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() =>
        expect(screen.getByText(/failed to save note/i)).toBeInTheDocument(),
      )
      expect(screen.getByRole('textbox')).toBeInTheDocument()

      // optimistic update rolled back — cache restored to original
      const cached = queryClient.getQueryData(NOTE_QUERY_KEY) as ReturnType<typeof makeNote>
      expect(cached?.note?.body).toBe('Original text')
    })
  })

  describe('Cancel', () => {
    it('returns to read mode showing original body when cancelled', async () => {
      await openEditNote('Original text')
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Something else' } })
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.getByText('Original text')).toBeInTheDocument()
      expect(mockUpsertFn).not.toHaveBeenCalled()
    })

    it('returns to empty state when cancelled from Add a note', async () => {
      await openAddNote()
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Something' } })
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add a note/i })).toBeInTheDocument()
    })
  })
})
