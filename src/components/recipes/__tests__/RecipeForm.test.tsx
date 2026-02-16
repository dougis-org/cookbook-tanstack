import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Recipe } from "@/types/recipe"

const mockNavigate = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
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

  describe("cancel", () => {
    it("renders a cancel button that navigates back", () => {
      renderWithProviders(<RecipeForm />)

      const cancelBtn = screen.getByRole("button", { name: /cancel/i })
      expect(cancelBtn).toBeInTheDocument()

      fireEvent.click(cancelBtn)
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/recipes" })
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
