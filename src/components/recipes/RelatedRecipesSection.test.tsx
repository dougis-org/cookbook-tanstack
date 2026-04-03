import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

type RelatedRecipe = {
  id: string
  name: string
  imageUrl: null
  prepTime: null
  cookTime: null
  difficulty: null
  notes: null
  classificationId: string | null
  classificationName: null
  marked: boolean
}

const makeRelatedRecipe = (id: string, classificationId: string): RelatedRecipe => ({
  id,
  name: `Recipe ${id}`,
  imageUrl: null,
  prepTime: null,
  cookTime: null,
  difficulty: null,
  notes: null,
  classificationId,
  classificationName: null,
  marked: false,
})

let mockQueryFn: () => Promise<{ items: RelatedRecipe[]; total: number; page: number; pageSize: number }>

vi.mock("@/lib/trpc", () => ({
  trpc: {
    recipes: {
      list: {
        queryOptions: (input: { classificationIds?: string[]; pageSize?: number }) => ({
          queryKey: ["recipes", "list", input],
          queryFn: () => mockQueryFn(),
        }),
      },
    },
  },
}))

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params, ...props }: { children: React.ReactNode; to: string; params?: Record<string, string> }) => {
    const href = params ? to.replace(/\$(\w+)/g, (_, k) => params[k] ?? '') : to
    return <a href={href} {...props}>{children}</a>
  },
}))

import RelatedRecipesSection from "@/components/recipes/RelatedRecipesSection"

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe("RelatedRecipesSection", () => {
  it("renders heading and recipe cards when related recipes exist", async () => {
    mockQueryFn = async () => ({
      items: [
        makeRelatedRecipe("r2", "cls1"),
        makeRelatedRecipe("r3", "cls1"),
      ],
      total: 2, page: 1, pageSize: 7,
    })

    renderWithProviders(
      <RelatedRecipesSection classificationId="cls1" currentRecipeId="r1" />
    )

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /related recipes/i })).toBeInTheDocument()
    })
    expect(screen.getAllByTestId("recipe-card")).toHaveLength(2)
  })

  it("does not render when classificationId is undefined", async () => {
    mockQueryFn = async () => ({ items: [], total: 0, page: 1, pageSize: 7 })

    const { container } = renderWithProviders(
      <RelatedRecipesSection classificationId={undefined} currentRecipeId="r1" />
    )

    await new Promise(r => setTimeout(r, 50))
    expect(container).toBeEmptyDOMElement()
  })

  it("does not render when classificationId is null", async () => {
    mockQueryFn = async () => ({ items: [], total: 0, page: 1, pageSize: 7 })

    const { container } = renderWithProviders(
      <RelatedRecipesSection classificationId={null} currentRecipeId="r1" />
    )

    await new Promise(r => setTimeout(r, 50))
    expect(container).toBeEmptyDOMElement()
  })

  it("does not render when query returns empty results", async () => {
    mockQueryFn = async () => ({ items: [], total: 0, page: 1, pageSize: 7 })

    const { container } = renderWithProviders(
      <RelatedRecipesSection classificationId="cls1" currentRecipeId="r1" />
    )

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement()
    })
  })

  it("excludes the current recipe from displayed cards", async () => {
    mockQueryFn = async () => ({
      items: [
        makeRelatedRecipe("r1", "cls1"),
        makeRelatedRecipe("r2", "cls1"),
        makeRelatedRecipe("r3", "cls1"),
      ],
      total: 3, page: 1, pageSize: 7,
    })

    renderWithProviders(
      <RelatedRecipesSection classificationId="cls1" currentRecipeId="r1" />
    )

    await waitFor(() => {
      expect(screen.getAllByTestId("recipe-card")).toHaveLength(2)
    })
    expect(screen.queryByText("Recipe r1")).not.toBeInTheDocument()
  })

  it("each card links to /recipes/$recipeId", async () => {
    mockQueryFn = async () => ({
      items: [makeRelatedRecipe("r2", "cls1")],
      total: 1, page: 1, pageSize: 7,
    })

    renderWithProviders(
      <RelatedRecipesSection classificationId="cls1" currentRecipeId="r1" />
    )

    await waitFor(() => {
      expect(screen.getByTestId("recipe-card")).toBeInTheDocument()
    })
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/recipes/r2")
  })

  it("section has print:hidden class", async () => {
    mockQueryFn = async () => ({
      items: [makeRelatedRecipe("r2", "cls1")],
      total: 1, page: 1, pageSize: 7,
    })

    renderWithProviders(
      <RelatedRecipesSection classificationId="cls1" currentRecipeId="r1" />
    )

    await waitFor(() => {
      expect(screen.getByTestId("related-recipes-section")).toBeInTheDocument()
    })
    expect(screen.getByTestId("related-recipes-section")).toHaveClass("print:hidden")
  })
})
