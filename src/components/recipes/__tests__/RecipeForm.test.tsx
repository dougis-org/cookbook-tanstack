import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Recipe } from "@/types/recipe"

const mockNavigate = vi.fn()
const mockRouterBack = vi.fn()
const mockBlockerProceed = vi.fn()
const mockBlockerReset = vi.fn()
const mockBlocker = {
  status: "idle" as string,
  proceed: mockBlockerProceed,
  reset: mockBlockerReset,
}
let capturedShouldBlockFn: (() => boolean) | undefined

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
  useRouter: () => ({ history: { back: mockRouterBack } }),
  useBlocker: (options: { shouldBlockFn: () => boolean }) => {
    capturedShouldBlockFn = options.shouldBlockFn
    return mockBlocker
  },
}))

vi.mock("@/lib/trpc", () => ({
  trpc: {
    recipes: {
      create: { mutationOptions: () => ({ mutationFn: vi.fn() }) },
      update: { mutationOptions: () => ({ mutationFn: vi.fn() }) },
    },
    classifications: {
      list: { queryOptions: () => ({ queryKey: ["classifications"], queryFn: () => [] }) },
    },
    meals: {
      list: { queryOptions: () => ({ queryKey: ["meals"], queryFn: () => [{ id: "m1", name: "Breakfast" }] }) },
    },
    courses: {
      list: { queryOptions: () => ({ queryKey: ["courses"], queryFn: () => [{ id: "c1", name: "Appetizer" }] }) },
    },
    preparations: {
      list: { queryOptions: () => ({ queryKey: ["preparations"], queryFn: () => [{ id: "p1", name: "Baked" }] }) },
    },
    sources: {
      list: { queryOptions: () => ({ queryKey: ["sources", "list"], queryFn: () => [{ id: "src1", name: "Serious Eats", url: null }] }) },
      search: { queryOptions: () => ({ queryKey: ["sources", "search"], queryFn: () => [] }) },
    },
  },
}))

import RecipeForm from "@/components/recipes/RecipeForm"

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe("RecipeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBlocker.status = "idle"
    capturedShouldBlockFn = undefined
  })

  describe("rendering", () => {
    it("renders create mode when no initialData", () => {
      renderWithProviders(<RecipeForm />)

      expect(screen.getByText("Create New Recipe")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /create recipe/i })).toBeInTheDocument()
    })

    it("renders edit mode when initialData is provided", () => {
      renderWithProviders(<RecipeForm initialData={makeRecipe({ name: "Pasta" })} />)

      expect(screen.getByText("Edit Recipe")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /update recipe/i })).toBeInTheDocument()
    })

    it("renders all form fields with proper labels", () => {
      renderWithProviders(<RecipeForm />)

      expect(screen.getByLabelText(/recipe name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/ingredients/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/instructions/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/prep time/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cook time/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/servings/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument()
    })

    it("renders nutrition fields", () => {
      renderWithProviders(<RecipeForm />)

      expect(screen.getByLabelText(/calories/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/fat/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cholesterol/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/sodium/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/protein/i)).toBeInTheDocument()
    })

    it("pre-fills nutrition fields in edit mode", () => {
      renderWithProviders(
        <RecipeForm
          initialData={makeRecipe({
            calories: 450,
            fat: 18,
            cholesterol: 65,
            sodium: 800,
            protein: 25,
          })}
        />,
      )

      expect(screen.getByLabelText(/calories/i)).toHaveValue(450)
      expect(screen.getByLabelText(/fat/i)).toHaveValue(18)
      expect(screen.getByLabelText(/cholesterol/i)).toHaveValue(65)
      expect(screen.getByLabelText(/sodium/i)).toHaveValue(800)
      expect(screen.getByLabelText(/protein/i)).toHaveValue(25)
    })

    it("pre-fills fields in edit mode", () => {
      renderWithProviders(
        <RecipeForm
          initialData={makeRecipe({
            name: "Spaghetti",
            notes: "A classic dish",
            ingredients: "Pasta\nSauce",
            instructions: "Boil\nMix",
            prepTime: 10,
            cookTime: 20,
            servings: 4,
            difficulty: "easy",
          })}
        />,
      )

      expect(screen.getByLabelText(/recipe name/i)).toHaveValue("Spaghetti")
      expect(screen.getByLabelText(/notes/i)).toHaveValue("A classic dish")
      expect(screen.getByLabelText(/ingredients/i)).toHaveValue("Pasta\nSauce")
      expect(screen.getByLabelText(/instructions/i)).toHaveValue("Boil\nMix")
      expect(screen.getByLabelText(/prep time/i)).toHaveValue(10)
      expect(screen.getByLabelText(/cook time/i)).toHaveValue(20)
      expect(screen.getByLabelText(/servings/i)).toHaveValue(4)
      expect(screen.getByLabelText(/difficulty/i)).toHaveValue("easy")
    })
  })

  describe("validation", () => {
    it("shows error when name is empty on submit", async () => {
      renderWithProviders(<RecipeForm />)

      fireEvent.click(screen.getByRole("button", { name: /create recipe/i }))

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })
  })

  describe("source picker", () => {
    it("renders source picker dropdown trigger", () => {
      renderWithProviders(<RecipeForm />)
      expect(screen.getByRole("button", { name: /select a source/i })).toBeInTheDocument()
    })

    it("shows selected source name when initialData has a sourceId and sourceName", () => {
      renderWithProviders(
        <RecipeForm initialData={{ ...makeRecipe({ sourceId: "src1" }), sourceName: "Serious Eats" }} />,
      )
      expect(screen.getByRole("button", { name: /serious eats/i })).toBeInTheDocument()
    })
  })

  describe("taxonomy dropdowns", () => {
    it("renders taxonomy dropdown triggers after difficulty", async () => {
      renderWithProviders(<RecipeForm />)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /all meals/i })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /all courses/i })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /all preparations/i })).toBeInTheDocument()
      })
    })

    it("shows pre-selected meal in edit mode", async () => {
      renderWithProviders(
        <RecipeForm
          initialData={{
            ...makeRecipe(),
            meals: [{ id: "m1", name: "Breakfast" }],
            courses: [],
            preparations: [],
          }}
        />,
      )

      await waitFor(() => {
        // Button label shows the selected item name when exactly 1 is selected
        expect(screen.getByRole("button", { name: /breakfast/i })).toBeInTheDocument()
      })
    })
  })

  describe("cancel", () => {
    it("renders a cancel button that falls back to /recipes when no prior history", () => {
      renderWithProviders(<RecipeForm />)

      const cancelBtn = screen.getByRole("button", { name: /cancel/i })
      expect(cancelBtn).toBeInTheDocument()

      fireEvent.click(cancelBtn)
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/recipes" })
    })

    it("calls router.history.back() when prior history exists", () => {
      Object.defineProperty(window, "history", {
        value: { ...window.history, length: 3 },
        writable: true,
        configurable: true,
      })
      renderWithProviders(<RecipeForm />)
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
      expect(mockRouterBack).toHaveBeenCalled()
      Object.defineProperty(window, "history", {
        value: { ...window.history, length: 1 },
        writable: true,
        configurable: true,
      })
    })
  })

  describe("unsaved-changes guard", () => {
    it("shouldBlockFn returns false on clean new form (no false positive)", () => {
      renderWithProviders(<RecipeForm />)
      expect(capturedShouldBlockFn?.()).toBe(false)
    })

    it("shouldBlockFn returns false on clean edit form with existing data (no false positive)", () => {
      renderWithProviders(
        <RecipeForm
          initialData={{
            ...makeRecipe(),
            meals: [{ id: "m1", name: "Breakfast" }],
            courses: [],
            preparations: [],
          }}
        />,
      )
      expect(capturedShouldBlockFn?.()).toBe(false)
    })

    it("shouldBlockFn returns true after typing in a field (dirty via RHF)", async () => {
      renderWithProviders(<RecipeForm />)
      await userEvent.type(screen.getByLabelText(/recipe name/i), "New Recipe")
      expect(capturedShouldBlockFn?.()).toBe(true)
    })

    it("shouldBlockFn returns true after selecting a taxonomy item (dirty via taxonomy)", async () => {
      renderWithProviders(<RecipeForm />)
      await waitFor(() => expect(screen.getByRole("button", { name: /all meals/i })).toBeInTheDocument())
      await userEvent.click(screen.getByRole("button", { name: /all meals/i }))
      await userEvent.click(screen.getByRole("checkbox", { name: /breakfast/i }))
      expect(capturedShouldBlockFn?.()).toBe(true)
    })

    it("shouldBlockFn returns false after deselecting and reselecting the same taxonomy item", async () => {
      renderWithProviders(
        <RecipeForm
          initialData={{
            ...makeRecipe(),
            meals: [{ id: "m1", name: "Breakfast" }],
            courses: [],
            preparations: [],
          }}
        />,
      )
      await waitFor(() => expect(screen.getByRole("button", { name: /breakfast/i })).toBeInTheDocument())
      // Open dropdown and deselect Breakfast
      await userEvent.click(screen.getByRole("button", { name: /breakfast/i }))
      await userEvent.click(screen.getByRole("checkbox", { name: /breakfast/i }))
      // Re-select Breakfast (dropdown stays open)
      await userEvent.click(screen.getByRole("checkbox", { name: /breakfast/i }))
      expect(capturedShouldBlockFn?.()).toBe(false)
    })

    it("does not show ConfirmDialog when blocker is idle (clean form)", () => {
      renderWithProviders(<RecipeForm />)
      expect(screen.queryByText(/you have unsaved changes/i)).not.toBeInTheDocument()
    })

    it("shows ConfirmDialog when blocker is blocked (dirty form navigation)", () => {
      mockBlocker.status = "blocked"
      renderWithProviders(<RecipeForm />)
      expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument()
    })

    it("calls blocker.proceed when Discard Changes is clicked", () => {
      mockBlocker.status = "blocked"
      renderWithProviders(<RecipeForm />)
      fireEvent.click(screen.getByRole("button", { name: /discard changes/i }))
      expect(mockBlockerProceed).toHaveBeenCalled()
    })

    it("calls blocker.reset when Keep Editing is clicked", () => {
      mockBlocker.status = "blocked"
      renderWithProviders(<RecipeForm />)
      fireEvent.click(screen.getByRole("button", { name: /keep editing/i }))
      expect(mockBlockerReset).toHaveBeenCalled()
    })
  })
})

/** Factory to build a full Recipe object for testing. */
function makeRecipe(overrides: Partial<Record<string, unknown>> = {}): Recipe {
  return {
    id: "test-id",
    userId: "user-1",
    name: "Test Recipe",
    ingredients: null,
    instructions: null,
    notes: null,
    servings: null,
    prepTime: null,
    cookTime: null,
    difficulty: null,
    sourceId: null,
    classificationId: null,
    dateAdded: new Date(),
    calories: null,
    fat: null,
    cholesterol: null,
    sodium: null,
    protein: null,
    marked: false,
    imageUrl: null,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Recipe
}
