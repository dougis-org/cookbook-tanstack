/**
 * Unit tests for cookbook detail page chapter UI:
 * - ChapterHeader (owner vs non-owner icon visibility, rename/delete callbacks)
 * - AddRecipeModal chapter picker (shown/hidden, default selection)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChapterHeader, AddRecipeModal, CollaboratorsPanel } from '@/routes/cookbooks.$cookbookId'

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

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ session: null, isPending: false, isLoggedIn: false, userId: null }) }))

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

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { items: [] }, isLoading: false }),
  useMutation: () => ({ mutate: mockAddMutate, isPending: false }),
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
      addCollaborator: { mutationOptions: (o: unknown) => o },
      removeCollaborator: { mutationOptions: (o: unknown) => o },
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
        isOwner={false}
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
        isOwner={true}
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
        isOwner={false}
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
        isOwner={true}
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
        isOwner={true}
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

function makeCollaborator(overrides: Partial<{ id: string; userId: string; name: string; role: 'editor' | 'viewer'; addedAt: Date }> = {}) {
  return {
    id: 'collab-1',
    userId: 'user-2',
    name: 'Alice',
    role: 'editor' as const,
    addedAt: new Date(),
    ...overrides,
  }
}

describe('CollaboratorsPanel', () => {
  it('renders collapsed by default with collaborator count', () => {
    render(
      <CollaboratorsPanel
        collaborators={[makeCollaborator(), makeCollaborator({ id: 'collab-2', userId: 'user-3', name: 'Bob', role: 'viewer' })]}
        isOwner={false}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    expect(screen.getByText(/Collaborators/)).toBeInTheDocument()
    expect(screen.getByText('(2)')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('expands to show collaborators when clicked', () => {
    render(
      <CollaboratorsPanel
        collaborators={[makeCollaborator({ name: 'Alice' })]}
        isOwner={false}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Collaborators/i }))
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows Remove button for each collaborator when isOwner', () => {
    render(
      <CollaboratorsPanel
        collaborators={[makeCollaborator({ name: 'Alice' })]}
        isOwner={true}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Collaborators/i }))
    expect(screen.getByLabelText('Remove Alice')).toBeInTheDocument()
  })

  it('does not show Remove button for non-owner', () => {
    render(
      <CollaboratorsPanel
        collaborators={[makeCollaborator({ name: 'Alice' })]}
        isOwner={false}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Collaborators/i }))
    expect(screen.queryByLabelText('Remove Alice')).not.toBeInTheDocument()
  })

  it('shows invite link when isOwner', () => {
    render(
      <CollaboratorsPanel
        collaborators={[]}
        isOwner={true}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Collaborators/i }))
    expect(screen.getByText(/Invite collaborator/)).toBeInTheDocument()
  })

  it('does not show invite link for non-owner', () => {
    render(
      <CollaboratorsPanel
        collaborators={[]}
        isOwner={false}
        onInvite={vi.fn()}
        onRemove={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Collaborators/i }))
    expect(screen.queryByText(/Invite collaborator/)).not.toBeInTheDocument()
  })

  it('calls onRemove with correct collaborator when Remove is clicked', () => {
    const onRemove = vi.fn()
    const collab = makeCollaborator({ name: 'Alice' })
    render(
      <CollaboratorsPanel
        collaborators={[collab]}
        isOwner={true}
        onInvite={vi.fn()}
        onRemove={onRemove}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Collaborators/i }))
    fireEvent.click(screen.getByLabelText('Remove Alice'))
    expect(onRemove).toHaveBeenCalledWith(collab)
  })

  it('calls onInvite when invite link is clicked', () => {
    const onInvite = vi.fn()
    render(
      <CollaboratorsPanel
        collaborators={[]}
        isOwner={true}
        onInvite={onInvite}
        onRemove={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Collaborators/i }))
    fireEvent.click(screen.getByText(/Invite collaborator/))
    expect(onInvite).toHaveBeenCalledOnce()
  })
})
