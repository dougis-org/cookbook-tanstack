import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Route } from '@/routes/cookbooks.$cookbookId'

const CookbookDetailPage = (Route as any).component!

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router') as any
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ cookbookId: 'c1' }),
    createFileRoute: () => (componentObj: any) => ({
      ...componentObj,
      useParams: () => ({ cookbookId: 'c1' }),
    }),
    Link: ({ children, 'data-testid': testId, ...props }: any) => <a data-testid={testId} {...props}>{children}</a>,
  }
})

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

vi.mock('@/lib/trpc', () => {
  const mockMutationOptions = () => ({ mutationFn: vi.fn() })
  return {
    trpc: {
      cookbooks: {
        byId: { queryOptions: () => ({ queryKey: ['cookbooks', 'byId'] }) },
        delete: { mutationOptions: mockMutationOptions },
        removeRecipe: { mutationOptions: mockMutationOptions },
        reorderRecipes: { mutationOptions: mockMutationOptions },
        createChapter: { mutationOptions: mockMutationOptions },
        renameChapter: { mutationOptions: mockMutationOptions },
        deleteChapter: { mutationOptions: mockMutationOptions },
        reorderChapters: { mutationOptions: mockMutationOptions },
        buildChaptersByCategory: { mutationOptions: mockMutationOptions },
        addCollaborator: { mutationOptions: mockMutationOptions },
        removeCollaborator: { mutationOptions: mockMutationOptions },
        onboardCollaborator: { mutationOptions: mockMutationOptions },
      },
    },
  }
})

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <>{children}</>,
  closestCenter: vi.fn(),
  pointerWithin: vi.fn(() => []),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  DragOverlay: ({ children }: any) => <>{children}</>,
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  rectSortingStrategy: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  arrayMove: vi.fn((arr: any[]) => arr),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}))

describe('cookbooks.$cookbookId (CookbookDetailPage)', () => {
  let mockReorderMutate: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockReorderMutate = vi.fn()

    mockUseAuth.mockReturnValue({ userId: 'u1' })
    mockUseMutation.mockImplementation(() => ({
      mutate: mockReorderMutate,
      isPending: false,
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function setupMockData(options: { canEdit: boolean, hasChapters: boolean, hasUnchaptered: boolean }) {
    mockUseAuth.mockReturnValue({ userId: options.canEdit ? 'owner_1' : 'viewer_1' })
    
    const chapters = options.hasChapters ? [
      { id: 'ch1', name: 'Chapter 1', orderIndex: 0 },
      { id: 'ch2', name: 'Chapter 2', orderIndex: 1 },
    ] : []

    const recipes = []
    if (options.hasChapters) {
      recipes.push({ id: 'r1', name: 'Zebra Cake', chapterId: 'ch1', orderIndex: 0 })
      recipes.push({ id: 'r2', name: 'Apple Pie', chapterId: 'ch1', orderIndex: 1 })
      recipes.push({ id: 'r3', name: 'The Best Chili', chapterId: 'ch2', orderIndex: 0 })
      recipes.push({ id: 'r4', name: 'A Great Soup', chapterId: 'ch2', orderIndex: 1 })
    } else {
      // Flat cookbook
      recipes.push({ id: 'r1', name: 'Zebra Cake', orderIndex: 0 })
      recipes.push({ id: 'r2', name: 'Apple Pie', orderIndex: 1 })
    }

    if (options.hasUnchaptered && options.hasChapters) {
      recipes.push({ id: 'r5', name: 'Banana Bread', orderIndex: 2 }) // no chapterId
      recipes.push({ id: 'r6', name: 'An Amazing Cake', orderIndex: 3 }) // no chapterId
    }

    mockUseQuery.mockReturnValue({
      data: {
        id: 'c1',
        name: 'My Cookbook',
        userId: 'owner_1',
        chapters,
        recipes,
      },
      isLoading: false,
    })

    return { chapters, recipes }
  }

  function openConfirmModal(openButtonName: string | RegExp) {
    fireEvent.click(screen.getByRole('button', { name: openButtonName }))
  }

  function confirmModal(confirmButtonName: string | RegExp) {
    const buttons = screen.getAllByRole('button', { name: confirmButtonName })
    fireEvent.click(buttons[0])
  }

  function expectReorderCalledWith(recipeIds: string[], extra: Record<string, unknown> = {}) {
    expect(mockReorderMutate).toHaveBeenCalledWith(
      expect.objectContaining({ recipeIds, ...extra }),
      expect.anything()
    )
  }

  describe('Cookbook-level "Resort All" action', () => {
    it('is rendered next to "Build Chapters by Category" when canEdit is true', () => {
      setupMockData({ canEdit: true, hasChapters: true, hasUnchaptered: false })
      render(<CookbookDetailPage />)
      expect(screen.getByRole('button', { name: /Resort All/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Build Chapters by Category/i })).toBeInTheDocument()
    })

    it('is NOT rendered when canEdit is false', () => {
      setupMockData({ canEdit: false, hasChapters: true, hasUnchaptered: false })
      render(<CookbookDetailPage />)
      expect(screen.queryByRole('button', { name: /Resort All/i })).not.toBeInTheDocument()
    })

    it('opens a confirmation prompt and does NOT call reorderRecipes yet', async () => {
      setupMockData({ canEdit: true, hasChapters: true, hasUnchaptered: false })
      render(<CookbookDetailPage />)

      openConfirmModal(/Resort All/i)

      expect(screen.getByText(/Sort every chapter's recipes alphabetically by title\?/i)).toBeInTheDocument()
      expect(mockReorderMutate).not.toHaveBeenCalled()
    })

    it('closes confirmation prompt on cancel without calling reorderRecipes', () => {
      setupMockData({ canEdit: true, hasChapters: true, hasUnchaptered: false })
      render(<CookbookDetailPage />)

      openConfirmModal(/Resort All/i)
      expect(screen.getByText(/Sort every chapter's recipes/i)).toBeInTheDocument()

      confirmModal(/Cancel/i)
      expect(screen.queryByText(/Sort every chapter's recipes/i)).not.toBeInTheDocument()
      expect(mockReorderMutate).not.toHaveBeenCalled()
    })

    it('calls reorderRecipes with a flat recipeIds payload globally sorted when confirmed on a chaptered cookbook', () => {
      setupMockData({ canEdit: true, hasChapters: true, hasUnchaptered: false })
      render(<CookbookDetailPage />)

      openConfirmModal(/Resort All/i)
      confirmModal(/Resort All/i)

      // We expect the payload to be the global sort across all recipes:
      // Apple Pie (r2) -> Best Chili (The Best Chili, r3) -> Great Soup (A Great Soup, r4) -> Zebra Cake (r1)
      expectReorderCalledWith(['r2', 'r3', 'r4', 'r1'], { cookbookId: 'c1' })
    })

    it('sorts unchaptered recipes as their own bucket correctly when confirmed', () => {
      setupMockData({ canEdit: true, hasChapters: true, hasUnchaptered: true })
      render(<CookbookDetailPage />)

      openConfirmModal(/Resort All/i)
      confirmModal(/Resort All/i)

      // Global sort of [Zebra Cake, Apple Pie, The Best Chili, A Great Soup, Banana Bread, An Amazing Cake]
      // Normalized:
      // Amazing Cake (An Amazing Cake, r6)
      // Apple Pie (r2)
      // Banana Bread (r5)
      // Best Chili (The Best Chili, r3)
      // Great Soup (A Great Soup, r4)
      // Zebra Cake (r1)
      expectReorderCalledWith(['r6', 'r2', 'r5', 'r3', 'r4', 'r1'])
    })

    it('sorts flat cookbook when confirmed', () => {
      setupMockData({ canEdit: true, hasChapters: false, hasUnchaptered: false })
      render(<CookbookDetailPage />)

      openConfirmModal(/Resort All/i)
      confirmModal(/Resort All/i)

      // Zebra Cake, Apple Pie -> Apple Pie, Zebra Cake
      expectReorderCalledWith(['r2', 'r1'])
    })

    it('uses chapter-free confirmation copy for a flat cookbook', () => {
      setupMockData({ canEdit: true, hasChapters: false, hasUnchaptered: false })
      render(<CookbookDetailPage />)

      openConfirmModal(/Resort All/i)
      expect(screen.getByText(/Sort all recipes alphabetically by title\?/i)).toBeInTheDocument()
      expect(screen.queryByText(/Sort every chapter's recipes/i)).not.toBeInTheDocument()
    })
  })

  describe('Chapter-level sort', () => {
    it('is rendered in the chapter header when canEdit is true', () => {
      setupMockData({ canEdit: true, hasChapters: true, hasUnchaptered: false })
      render(<CookbookDetailPage />)
      expect(screen.getByRole('button', { name: 'Sort Chapter 1 recipes by title' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sort Chapter 2 recipes by title' })).toBeInTheDocument()
    })

    it('is NOT rendered when canEdit is false', () => {
      setupMockData({ canEdit: false, hasChapters: true, hasUnchaptered: false })
      render(<CookbookDetailPage />)
      expect(screen.queryByRole('button', { name: 'Sort Chapter 1 recipes by title' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Sort Chapter 2 recipes by title' })).not.toBeInTheDocument()
    })

    it('opens confirmation prompt without calling reorderRecipes', () => {
      setupMockData({ canEdit: true, hasChapters: true, hasUnchaptered: false })
      render(<CookbookDetailPage />)

      openConfirmModal('Sort Chapter 1 recipes by title')
      expect(screen.getByText(/Sort this chapter's recipes alphabetically by title\?/i)).toBeInTheDocument()
      expect(mockReorderMutate).not.toHaveBeenCalled()
    })

    it('cancels without calling reorderRecipes', () => {
      setupMockData({ canEdit: true, hasChapters: true, hasUnchaptered: false })
      render(<CookbookDetailPage />)

      openConfirmModal('Sort Chapter 1 recipes by title')
      confirmModal(/Cancel/i)
      expect(mockReorderMutate).not.toHaveBeenCalled()
    })

    it('calls reorderRecipes with a payload scoped only to that chapter when confirmed', () => {
      setupMockData({ canEdit: true, hasChapters: true, hasUnchaptered: false })
      render(<CookbookDetailPage />)

      openConfirmModal('Sort Chapter 1 recipes by title')
      confirmModal('Sort Chapter')

      expectReorderCalledWith(['r2', 'r1'])
    })

    function setupSingleChapterMockData(chapters: Array<{ id: string, name: string, orderIndex: number }>, recipes: Array<{ id: string, name: string, chapterId: string, orderIndex: number }>) {
      mockUseAuth.mockReturnValue({ userId: 'owner_1' })
      mockUseQuery.mockReturnValue({
        data: { id: 'c1', name: 'My Cookbook', userId: 'owner_1', chapters, recipes },
        isLoading: false,
      })
    }

    it('is a safe no-op for a chapter with 0 recipes', () => {
      setupSingleChapterMockData(
        [
          { id: 'ch1', name: 'Empty Chapter', orderIndex: 0 },
          { id: 'ch2', name: 'Other Chapter', orderIndex: 1 },
        ],
        [{ id: 'r1', name: 'Other Recipe', chapterId: 'ch2', orderIndex: 0 }],
      )
      render(<CookbookDetailPage />)

      openConfirmModal('Sort Empty Chapter recipes by title')
      confirmModal('Sort Chapter')

      expect(mockReorderMutate).not.toHaveBeenCalled()
    })

    it('is a safe no-op for a chapter with 1 recipe', () => {
      setupSingleChapterMockData(
        [{ id: 'ch1', name: 'One Recipe Chapter', orderIndex: 0 }],
        [{ id: 'r1', name: 'A Cake', chapterId: 'ch1', orderIndex: 0 }],
      )
      render(<CookbookDetailPage />)

      openConfirmModal('Sort One Recipe Chapter recipes by title')
      confirmModal('Sort Chapter')

      expect(mockReorderMutate).not.toHaveBeenCalled()
    })
  })
})
