import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { Recipe } from "@/types/recipe"
import RecipeDetail from "@/components/recipes/RecipeDetail"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
}))

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

describe("RecipeDetail", () => {
  it("renders the recipe name", () => {
    render(<RecipeDetail recipe={makeRecipe({ name: "Pasta Carbonara" })} />)

    expect(screen.getByText("Pasta Carbonara")).toBeInTheDocument()
  })

  it("renders notes when provided", () => {
    render(<RecipeDetail recipe={makeRecipe({ notes: "A classic Roman dish" })} />)

    expect(screen.getByText("A classic Roman dish")).toBeInTheDocument()
  })

  it("renders ingredients from text lines", () => {
    render(
      <RecipeDetail
        recipe={makeRecipe({ ingredients: "Spaghetti\nEggs\nPancetta" })}
      />,
    )

    expect(screen.getByText("Spaghetti")).toBeInTheDocument()
    expect(screen.getByText("Eggs")).toBeInTheDocument()
    expect(screen.getByText("Pancetta")).toBeInTheDocument()
  })

  it("shows 'No ingredients listed' when empty", () => {
    render(<RecipeDetail recipe={makeRecipe()} />)

    expect(screen.getByText("No ingredients listed")).toBeInTheDocument()
  })

  it("renders instructions as numbered steps", () => {
    render(
      <RecipeDetail
        recipe={makeRecipe({ instructions: "Boil water\nCook pasta\nMix sauce" })}
      />,
    )

    expect(screen.getByText("Boil water")).toBeInTheDocument()
    expect(screen.getByText("Cook pasta")).toBeInTheDocument()
    expect(screen.getByText("Mix sauce")).toBeInTheDocument()
    // Step numbers
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("renders metadata when provided", () => {
    render(
      <RecipeDetail
        recipe={makeRecipe({ prepTime: 15, cookTime: 30, servings: 4, difficulty: "medium" })}
      />,
    )

    expect(screen.getByText("15 min")).toBeInTheDocument()
    expect(screen.getByText("30 min")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("medium")).toBeInTheDocument()
  })

  it("renders nutrition panel when data exists", () => {
    render(
      <RecipeDetail
        recipe={makeRecipe({ calories: 450, protein: 25, fat: 18 })}
      />,
    )

    expect(screen.getByText("Nutrition")).toBeInTheDocument()
    expect(screen.getByText("450")).toBeInTheDocument()
    expect(screen.getByText("25g")).toBeInTheDocument()
    expect(screen.getByText("18g")).toBeInTheDocument()
  })

  it("hides nutrition panel when no data exists", () => {
    render(<RecipeDetail recipe={makeRecipe()} />)

    expect(screen.queryByText("Nutrition")).not.toBeInTheDocument()
  })

  it("renders classification badge when classificationId and classificationName are provided", () => {
    render(
      <RecipeDetail
        recipe={{
          ...makeRecipe({ classificationId: "cat-1" }),
          classificationName: "Italian",
        }}
      />,
    )

    expect(screen.getByText("Italian")).toBeInTheDocument()
  })

  it("does not render classification badge when classificationName is absent", () => {
    render(<RecipeDetail recipe={makeRecipe({ classificationId: "cat-1" })} />)

    expect(screen.queryByText("Italian")).not.toBeInTheDocument()
  })

  it("renders meal, course, and preparation taxonomy badges", () => {
    render(
      <RecipeDetail
        recipe={{
          ...makeRecipe(),
          meals: [{ id: "m1", name: "Breakfast" }],
          courses: [{ id: "c1", name: "Entree" }],
          preparations: [{ id: "p1", name: "Bake" }],
        }}
      />,
    )

    expect(screen.getByText("Breakfast")).toBeInTheDocument()
    expect(screen.getByText("Entree")).toBeInTheDocument()
    expect(screen.getByText("Bake")).toBeInTheDocument()
  })

  it("renders source as a link when sourceUrl is provided", () => {
    render(
      <RecipeDetail
        recipe={{
          ...makeRecipe(),
          sourceName: "Bon Appétit",
          sourceUrl: "https://bonappetit.com",
        }}
      />,
    )

    const link = screen.getByRole("link", { name: "Bon Appétit" })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "https://bonappetit.com")
  })

  it("renders source as plain text when no sourceUrl", () => {
    render(
      <RecipeDetail
        recipe={{
          ...makeRecipe(),
          sourceName: "Grandma's Cookbook",
          sourceUrl: null,
        }}
      />,
    )

    expect(screen.getByText("Grandma's Cookbook")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Grandma's Cookbook" })).not.toBeInTheDocument()
  })

  it("does not render source section when sourceName is absent", () => {
    render(<RecipeDetail recipe={makeRecipe()} />)

    expect(screen.queryByText(/source:/i)).not.toBeInTheDocument()
  })
})
