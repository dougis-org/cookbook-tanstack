/**
 * Unit tests for cookbook detail page chapter UI:
 * - ChapterHeader (owner vs non-owner icon visibility, rename/delete callbacks)
 * - AddRecipeModal chapter picker (shown/hidden, default selection)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChapterHeader, AddRecipeModal, CollaboratorsPanel, OnboardingModal, BuildChaptersByCategoryModal, Route } from '@/routes/cookbooks.$cookbookId'

const CookbookDetailPage = Route.options.component!

// ─── Router mocks ────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', async () => {
  const { createRouterMock } = await import('@/test-helpers/mocks')
  return createRouterMock({ params: { cookbookId: 'cb-1' } })
})

// ─── DnD mocks ───────────────────────────────────────────────────────────────

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: () => [],
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  rectSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  arrayMove: vi.fn(),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

// ─── Misc UI mocks ───────────────────────────────────────────────────────────

vi.mock('@/components/layout/PageLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/cookbooks/CookbookFields', () => ({ default: () => null }))
vi.mock('@/components/cookbooks/CookbookRecipeCard', () => ({
  SortableRecipeCard: () => null,
  StaticRecipeCard: () => null,
}))
vi.mock('@/components/ui/CardImage', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))
vi.mock('@/components/ui/Breadcrumb', () => ({ default: () => null }))

let mockUserId: string | null = null
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ session: null, isPending: false, isLoggedIn: false, userId: mockUserId }),
}))

const mockAddMutate = vi.fn()
const mockOnSearchChange = vi.fn()
const mockFetchNextPage = vi.fn()
let mockRecipeSearchResult = {
  inputValue: '',
  onSearchChange: mockOnSearchChange,
  recipes: [] as { id: string; name: string; imageUrl: string | null }[],
  hasNextPage: false,
  fetchNextPage: mockFetchNextPage,
  isFetchingNextPage: false,
  isLoading: false,
}

let mockCookbookData: any = null
let mockQueryLoading = false
let mockMutate = mockAddMutate
let mockMutationPending = false
let mockMutationError: any = null
let mockMutationResult: any = undefined

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: mockCookbookData, isLoading: mockQueryLoading }),
  useMutation: () => ({
    mutate: (args: any, opts?: { onSuccess?: (data: any) => void }) => {
      mockMutate(args)
      opts?.onSuccess?.(mockMutationResult)
    },
    isPending: mockMutationPending,
    error: mockMutationError,
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    cookbooks: {
      byId: { queryOptions: () => ({}) },
      delete: { mutationOptions: (o: unknown) => o },
      removeRecipe: { mutationOptions: (o: unknown) => o },
      reorderRecipes: { mutationOptions: (o: unknown) => o },
      addRecipe: { mutationOptions: (o: unknown) => o },
      update: { mutationOptions: (o: unknown) => o },
      createChapter: { mutationOptions: (o: unknown) => o },
      renameChapter: { mutationOptions: (o: unknown) => o },
      deleteChapter: { mutationOptions: (o: unknown) => o },
      reorderChapters: { mutationOptions: (o: unknown) => o },
      buildChaptersByCategory: { mutationOptions: (o: unknown) => o },
      addCollaborator: { mutationOptions: (o: unknown) => o },
      removeCollaborator: { mutationOptions: (o: unknown) => o },
      onboardCollaborator: { mutationOptions: (o: unknown) => o },
    },
    recipes: { list: { queryOptions: () => ({}) } },
    users: { search: { queryOptions: () => ({}) } },
  },
}))

vi.mock('@/hooks/useRecipeSearch', () => ({
  useRecipeSearch: () => mockRecipeSearchResult,
}))

vi.mock('@/hooks/useScrollSentinel', () => ({
  useScrollSentinel: () => ({ current: null }),
}))

// ─── Types ───────────────────────────────────────────────────────────────────

interface Chapter {
  id: string
  name: string
  orderIndex: number
}

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return { id: 'ch-1', name: 'Chapter 1', orderIndex: 0, ...overrides }
}

// ─── ChapterHeader tests ─────────────────────────────────────────────────────

describe('ChapterHeader', () => {
  it('renders chapter name', () => {
    render(
      <ChapterHeader
        chapter={makeChapter({ name: 'Starters' })}
        canEdit={false}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText('Starters')).toBeInTheDocument()
  })

  it('shows rename and delete icons for owner', () => {
    render(
      <ChapterHeader
        chapter={makeChapter()}
        canEdit={true}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/Rename Chapter 1/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Delete Chapter 1/)).toBeInTheDocument()
  })

  it('does not show rename or delete icons for non-owner', () => {
    render(
      <ChapterHeader
        chapter={makeChapter()}
        canEdit={false}
        onRename={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.queryByLabelText(/Rename Chapter 1/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Delete Chapter 1/)).not.toBeInTheDocument()
  })

  it('calls onRename when pencil icon is clicked', () => {
    const onRename = vi.fn()
    render(
      <ChapterHeader
        chapter={makeChapter()}
        canEdit={true}
        onRename={onRename}
        onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByLabelText(/Rename Chapter 1/))
    expect(onRename).toHaveBeenCalledOnce()
  })

  it('calls onDelete when trash icon is clicked', () => {
    const onDelete = vi.fn()
    render(
      <ChapterHeader
        chapter={makeChapter()}
        canEdit={true}
        onRename={vi.fn()}
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByLabelText(/Delete Chapter 1/))
    expect(onDelete).toHaveBeenCalledOnce()
  })
})

// ─── AddRecipeModal chapter picker tests ─────────────────────────────────────

describe('AddRecipeModal — chapter picker', () => {
  beforeEach(() => {
    mockAddMutate.mockClear()
    mockOnSearchChange.mockClear()
    mockFetchNextPage.mockClear()
    mockRecipeSearchResult = {
      inputValue: '',
      onSearchChange: mockOnSearchChange,
      recipes: [],
      hasNextPage: false,
      fetchNextPage: mockFetchNextPage,
      isFetchingNextPage: false,
      isLoading: false,
    }
  })

  it('shows chapter picker dropdown when chapters exist', () => {
    render(
      <AddRecipeModal
        cookbookId="cb-1"
        existingRecipeIds={[]}
        chapters={[makeChapter({ name: 'Starters' })]}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Chapter')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Starters')).toBeInTheDocument()
  })

  it('does not show chapter picker when no chapters', () => {
    render(
      <AddRecipeModal
        cookbookId="cb-1"
        existingRecipeIds={[]}
        chapters={[]}
        onClose={vi.fn()}
      />
    )
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Chapter')).not.toBeInTheDocument()
  })

  it('chapter picker defaults to first chapter', () => {
    render(
      <AddRecipeModal
        cookbookId="cb-1"
        existingRecipeIds={[]}
        chapters={[
          makeChapter({ id: 'ch-1', name: 'Starters', orderIndex: 0 }),
          makeChapter({ id: 'ch-2', name: 'Mains', orderIndex: 1 }),
        ]}
        onClose={vi.fn()}
      />
    )
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('ch-1')
  })
})

// ─── AddRecipeModal — infinite scroll tests ───────────────────────────────────

describe('AddRecipeModal — infinite scroll', () => {
  it('renders recipes returned by useRecipeSearch', () => {
    mockRecipeSearchResult = {
      ...mockRecipeSearchResult,
      recipes: [
        { id: 'r-1', name: 'Pasta', imageUrl: null },
        { id: 'r-2', name: 'Pizza', imageUrl: null },
      ],
    }
    render(
      <AddRecipeModal cookbookId="cb-1" existingRecipeIds={[]} chapters={[]} onClose={vi.fn()} />
    )
    expect(screen.getByText('Pasta')).toBeInTheDocument()
    expect(screen.getByText('Pizza')).toBeInTheDocument()
  })

  it('filters out existingRecipeIds client-side', () => {
    mockRecipeSearchResult = {
      ...mockRecipeSearchResult,
      recipes: [
        { id: 'r-1', name: 'Pasta', imageUrl: null },
        { id: 'r-2', name: 'Pizza', imageUrl: null },
      ],
    }
    render(
      <AddRecipeModal cookbookId="cb-1" existingRecipeIds={['r-1']} chapters={[]} onClose={vi.fn()} />
    )
    expect(screen.queryByText('Pasta')).not.toBeInTheDocument()
    expect(screen.getByText('Pizza')).toBeInTheDocument()
  })

  it('calls onSearchChange when search input changes', () => {
    render(
      <AddRecipeModal cookbookId="cb-1" existingRecipeIds={[]} chapters={[]} onClose={vi.fn()} />
    )
    fireEvent.change(screen.getByRole('textbox', { name: /Search recipes/i }), {
      target: { value: 'pasta' },
    })
    expect(mockOnSearchChange).toHaveBeenCalledWith('pasta')
  })

  it('shows loading indicator when isFetchingNextPage is true', () => {
    mockRecipeSearchResult = { ...mockRecipeSearchResult, isFetchingNextPage: true }
    render(
      <AddRecipeModal cookbookId="cb-1" existingRecipeIds={[]} chapters={[]} onClose={vi.fn()} />
    )
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('does not show loading indicator when isFetchingNextPage is false', () => {
    mockRecipeSearchResult = { ...mockRecipeSearchResult, isFetchingNextPage: false }
    render(
      <AddRecipeModal cookbookId="cb-1" existingRecipeIds={[]} chapters={[]} onClose={vi.fn()} />
    )
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument()
  })
})

// ─── CollaboratorsPanel tests ─────────────────────────────────────────────────

function makeCollaborator(overrides: Partial<{ id: string; userId: string; name: string; role: 'editor' | 'viewer'; addedAt: Date; addedByName: string | null; onboarded: boolean }> = {}) {
  return {
    id: 'collab-1',
    userId: 'user-2',
    name: 'Alice',
    role: 'editor' as const,
    addedAt: new Date(),
    addedByName: null,
    onboarded: false,
    ...overrides,
  }
}

type Collab = ReturnType<typeof makeCollaborator>

function renderPanel(opts: {
  collaborators?: Collab[]
  isOwner?: boolean
  onInvite?: () => void
  onRemove?: (c: Collab) => void
  expand?: boolean
} = {}) {
  const {
    collaborators = [],
    isOwner = false,
    onInvite = vi.fn(),
    onRemove = vi.fn(),
    expand = false,
  } = opts
  render(
    <CollaboratorsPanel
      collaborators={collaborators}
      isOwner={isOwner}
      onInvite={onInvite}
      onRemove={onRemove}
    />
  )
  if (expand) fireEvent.click(screen.getByRole('button', { name: /Collaborators/i }))
  return { onInvite, onRemove }
}

describe('CollaboratorsPanel', () => {
  it('renders collapsed by default with collaborator count', () => {
    renderPanel({
      collaborators: [
        makeCollaborator(),
        makeCollaborator({ id: 'collab-2', userId: 'user-3', name: 'Bob', role: 'viewer' }),
      ],
    })
    expect(screen.getByText(/Collaborators/)).toBeInTheDocument()
    expect(screen.getByText('(2)')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('expands to show collaborators when clicked', () => {
    renderPanel({ collaborators: [makeCollaborator({ name: 'Alice' })], expand: true })
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows Remove button for each collaborator when isOwner', () => {
    renderPanel({ collaborators: [makeCollaborator({ name: 'Alice' })], isOwner: true, expand: true })
    expect(screen.getByLabelText('Remove Alice')).toBeInTheDocument()
  })

  it('does not show Remove button for non-owner', () => {
    renderPanel({ collaborators: [makeCollaborator({ name: 'Alice' })], expand: true })
    expect(screen.queryByLabelText('Remove Alice')).not.toBeInTheDocument()
  })

  it('shows invite link when isOwner', () => {
    renderPanel({ isOwner: true, expand: true })
    expect(screen.getByText(/Invite collaborator/)).toBeInTheDocument()
  })

  it('does not show invite link for non-owner', () => {
    renderPanel({ expand: true })
    expect(screen.queryByText(/Invite collaborator/)).not.toBeInTheDocument()
  })

  it('calls onRemove with correct collaborator when Remove is clicked', () => {
    const collab = makeCollaborator({ name: 'Alice' })
    const { onRemove } = renderPanel({ collaborators: [collab], isOwner: true, expand: true })
    fireEvent.click(screen.getByLabelText('Remove Alice'))
    expect(onRemove).toHaveBeenCalledWith(collab)
  })

  it('calls onInvite when invite link is clicked', () => {
    const { onInvite } = renderPanel({ isOwner: true, expand: true })
    fireEvent.click(screen.getByText(/Invite collaborator/))
    expect(onInvite).toHaveBeenCalledOnce()
  })
})

describe('OnboardingModal', () => {
  it('renders correct Editor copy', () => {
    const onAcknowledge = vi.fn()
    render(
      <OnboardingModal
        role="editor"
        isPending={false}
        error={null}
        onAcknowledge={onAcknowledge}
      />
    )
    expect(screen.getByText(/Editor ✏️/)).toBeInTheDocument()
    expect(screen.getByText(/Editor Capabilities/)).toBeInTheDocument()
    expect(screen.getByText(/add, edit, delete recipes/)).toBeInTheDocument()
    expect(screen.getByText(/organize chapters/)).toBeInTheDocument()
  })

  it('renders correct Viewer copy', () => {
    const onAcknowledge = vi.fn()
    render(
      <OnboardingModal
        role="viewer"
        isPending={false}
        error={null}
        onAcknowledge={onAcknowledge}
      />
    )
    expect(screen.getByText(/Viewer 👁️/)).toBeInTheDocument()
    expect(screen.getByText(/Viewer Capabilities/)).toBeInTheDocument()
    expect(screen.getByText(/read-only access/)).toBeInTheDocument()
    expect(screen.getByText(/printing/)).toBeInTheDocument()
    expect(screen.getByText(/bookmarking/)).toBeInTheDocument()
  })
})

describe('CookbookDetailPage — onboarding integration', () => {
  beforeEach(() => {
    mockUserId = 'collab-user-id'
    mockMutationPending = false
    mockMutationError = null
    mockMutate = mockAddMutate
    mockCookbookData = {
      id: 'cb-1',
      name: 'Shared Kitchen',
      userId: 'owner-id',
      collaborators: [
        {
          id: 'c-1',
          userId: 'collab-user-id',
          name: 'Collab User',
          role: 'editor',
          onboarded: false,
          addedAt: new Date(),
          addedByName: 'Owner',
        },
      ],
      recipes: [],
      chapters: [],
    }
  })

  it('auto-triggers and dismisses when acknowledging', () => {
    mockCookbookData.collaborators[0].onboarded = false

    const { rerender } = render(<CookbookDetailPage />)

    // The onboarding modal is shown automatically
    expect(screen.getByText(/Editor ✏️/)).toBeInTheDocument()

    // Mock mutate changes the data as the backend would, then we rerender
    const mockOnboardFn = vi.fn().mockImplementation(() => {
      mockCookbookData.collaborators[0].onboarded = true
    })
    mockMutate = mockOnboardFn

    // Clicking the CTA button invokes the onboarding mutation
    fireEvent.click(screen.getByRole('button', { name: /Got it!/i }))
    expect(mockOnboardFn).toHaveBeenCalledWith({ cookbookId: 'cb-1' })

    // Simulate reactive query invalidation / refetch
    rerender(<CookbookDetailPage />)

    // The onboarding modal should now be dismissed
    expect(screen.queryByText(/Editor ✏️/)).not.toBeInTheDocument()
  })

  it('does not display for collaborators who are already onboarded', () => {
    mockCookbookData.collaborators[0].onboarded = true

    render(<CookbookDetailPage />)

    // The onboarding modal should NOT be in the document
    expect(screen.queryByText(/Editor ✏️/)).not.toBeInTheDocument()
  })
})

// ─── BuildChaptersByCategoryModal tests ───────────────────────────────────────

describe('BuildChaptersByCategoryModal', () => {
  it('renders one row per category to be created and one per merge, with recipe counts', () => {
    render(
      <BuildChaptersByCategoryModal
        summary={{
          created: [{ name: 'Breakfast', recipeCount: 2 }],
          merged: [{ chapterId: 'ch-1', name: 'Dessert', recipeCount: 1 }],
        }}
        isPending={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('Breakfast')).toBeInTheDocument()
    expect(screen.getByText('2 recipes')).toBeInTheDocument()
    expect(screen.getByText('Dessert')).toBeInTheDocument()
    expect(screen.getByText('1 recipe')).toBeInTheDocument()
  })

  it('shows a no-op message and disables confirm when there is nothing to do', () => {
    render(
      <BuildChaptersByCategoryModal
        summary={{ created: [], merged: [] }}
        isPending={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText(/No unchaptered recipes to organize/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
  })

  it('calls onConfirm when Confirm is clicked', () => {
    const onConfirm = vi.fn()
    render(
      <BuildChaptersByCategoryModal
        summary={{ created: [{ name: 'Breakfast', recipeCount: 1 }], merged: [] }}
        isPending={false}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(
      <BuildChaptersByCategoryModal
        summary={{ created: [{ name: 'Breakfast', recipeCount: 1 }], merged: [] }}
        isPending={false}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

// ─── CookbookDetailPage — Build Chapters by Category button/flow ─────────────

describe('CookbookDetailPage — Build Chapters by Category', () => {
  const BUTTON_NAME = /Build Chapters by Category/i

  beforeEach(() => {
    mockUserId = 'owner-id'
    mockMutationPending = false
    mockMutationError = null
    mockMutationResult = undefined
    mockMutate = mockAddMutate
    mockAddMutate.mockClear()
    mockCookbookData = {
      id: 'cb-1',
      name: 'My Kitchen',
      userId: 'owner-id',
      collaborators: [],
      recipes: [
        { id: 'r-1', name: 'Pancakes', chapterId: null },
        { id: 'r-2', name: 'Cake', chapterId: null },
      ],
      chapters: [],
    }
  })

  it('renders for the owner', () => {
    render(<CookbookDetailPage />)
    expect(screen.getByRole('button', { name: BUTTON_NAME })).toBeInTheDocument()
  })

  it('renders for an editor collaborator', () => {
    mockUserId = 'editor-id'
    mockCookbookData.collaborators = [
      { id: 'c-1', userId: 'editor-id', name: 'Editor', role: 'editor', onboarded: true, addedAt: new Date(), addedByName: 'Owner' },
    ]
    render(<CookbookDetailPage />)
    expect(screen.getByRole('button', { name: BUTTON_NAME })).toBeInTheDocument()
  })

  it('does not render for a non-owner, non-editor viewer', () => {
    mockUserId = 'viewer-id'
    mockCookbookData.collaborators = [
      { id: 'c-1', userId: 'viewer-id', name: 'Viewer', role: 'viewer', onboarded: true, addedAt: new Date(), addedByName: 'Owner' },
    ]
    render(<CookbookDetailPage />)
    expect(screen.queryByRole('button', { name: BUTTON_NAME })).not.toBeInTheDocument()
  })

  it('is disabled when every recipe already has a chapterId', () => {
    mockCookbookData.recipes = [{ id: 'r-1', name: 'Pancakes', chapterId: 'ch-1' }]
    render(<CookbookDetailPage />)
    expect(screen.getByRole('button', { name: BUTTON_NAME })).toBeDisabled()
  })

  it('is disabled when the cookbook has zero recipes', () => {
    mockCookbookData.recipes = []
    render(<CookbookDetailPage />)
    expect(screen.getByRole('button', { name: BUTTON_NAME })).toBeDisabled()
  })

  it('clicking the enabled button triggers a dryRun call and opens the preview modal on success', () => {
    mockMutationResult = { summary: { created: [{ name: 'Breakfast', recipeCount: 2 }], merged: [] } }
    render(<CookbookDetailPage />)

    fireEvent.click(screen.getByRole('button', { name: BUTTON_NAME }))

    expect(mockAddMutate).toHaveBeenCalledWith({ cookbookId: 'cb-1', dryRun: true })
    expect(screen.getByText('Build Chapters by Category', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByText('Breakfast')).toBeInTheDocument()
  })

  it('confirming the modal calls the mutation without dryRun', () => {
    mockMutationResult = { summary: { created: [{ name: 'Breakfast', recipeCount: 2 }], merged: [] } }
    render(<CookbookDetailPage />)

    fireEvent.click(screen.getByRole('button', { name: BUTTON_NAME }))
    mockAddMutate.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(mockAddMutate).toHaveBeenCalledWith({ cookbookId: 'cb-1' })
  })

  it('cancelling the preview modal calls no mutation and closes it', () => {
    mockMutationResult = { summary: { created: [{ name: 'Breakfast', recipeCount: 2 }], merged: [] } }
    render(<CookbookDetailPage />)

    fireEvent.click(screen.getByRole('button', { name: BUTTON_NAME }))
    mockAddMutate.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockAddMutate).not.toHaveBeenCalled()
    expect(screen.queryByText('Build Chapters by Category', { selector: 'h2' })).not.toBeInTheDocument()
  })
})
