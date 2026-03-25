/**
 * Unit tests for cookbook detail page chapter UI:
 * - ChapterHeader (owner vs non-owner icon visibility, rename/delete callbacks)
 * - AddRecipeModal chapter picker (shown/hidden, default selection)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChapterHeader, AddRecipeModal } from '@/routes/cookbooks.$cookbookId'

// ─── Router mocks ────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => ({
    ...opts,
    useParams: () => ({ cookbookId: 'cb-1' }),
  }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}))

// ─── DnD mocks ───────────────────────────────────────────────────────────────

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: () => [],
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
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
vi.mock('@/components/ui/CardImage', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))
vi.mock('@/components/ui/Breadcrumb', () => ({ default: () => null }))

vi.mock('@/lib/auth-client', () => ({ useSession: () => ({ data: null }) }))

const mockAddMutate = vi.fn()

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
    },
    recipes: { list: { queryOptions: () => ({}) } },
  },
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
