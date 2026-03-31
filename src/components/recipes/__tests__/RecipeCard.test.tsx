import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import type { Recipe } from "@/types/recipe"
import RecipeCard from "@/components/recipes/RecipeCard"

type RecipeCardRecipe = Pick<Recipe, 'id' | 'name' | 'imageUrl' | 'prepTime' | 'cookTime' | 'difficulty' | 'notes' | 'classificationId'> & {
  classificationName?: string | null
  marked?: boolean
}

function makeRecipe(overrides: Partial<RecipeCardRecipe> = {}): RecipeCardRecipe {
  return {
    id: "r1",
    name: "Test Recipe",
    imageUrl: null,
    prepTime: null,
    cookTime: null,
    difficulty: null,
    notes: null,
    classificationId: null,
    ...overrides,
  }
}

describe("RecipeCard", () => {
  it("renders recipe name", () => {
    render(<RecipeCard recipe={makeRecipe({ name: "Banana Bread" })} />)

    expect(screen.getByText("Banana Bread")).toBeInTheDocument()
  })

  it.each([
    { label: "null imageUrl", imageUrl: null },
    { label: "empty string imageUrl", imageUrl: "" },
  ])("does not render image container when imageUrl is $label", ({ imageUrl }) => {
    render(<RecipeCard recipe={makeRecipe({ imageUrl })} />)

    expect(screen.queryByTestId("recipe-card-image")).not.toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.queryByText("No Image")).not.toBeInTheDocument()
  })

  it("renders image container and img when imageUrl is provided", () => {
    render(<RecipeCard recipe={makeRecipe({ imageUrl: "https://example.com/bread.jpg", name: "Banana Bread" })} />)

    expect(screen.getByTestId("recipe-card-image")).toBeInTheDocument()
    const img = screen.getByRole("img", { name: "Banana Bread" })
    expect(img).toHaveAttribute("src", "https://example.com/bread.jpg")
  })

  it("renders notes when provided", () => {
    render(<RecipeCard recipe={makeRecipe({ notes: "Quick and easy" })} />)

    expect(screen.getByText("Quick and easy")).toBeInTheDocument()
  })

  it("renders prep and cook times when provided", () => {
    render(<RecipeCard recipe={makeRecipe({ prepTime: 10, cookTime: 45 })} />)

    expect(screen.getByText("Prep: 10 min")).toBeInTheDocument()
    expect(screen.getByText("Cook: 45 min")).toBeInTheDocument()
  })

  it("renders difficulty badge when provided", () => {
    render(<RecipeCard recipe={makeRecipe({ difficulty: "easy" })} />)

    expect(screen.getByText("easy")).toBeInTheDocument()
  })

  it("renders a filled heart icon when marked={true}", () => {
    render(<RecipeCard recipe={makeRecipe()} marked={true} />)

    const heart = screen.getByTestId("heart-icon")
    expect(heart).toBeInTheDocument()
    expect(heart).toHaveClass("fill-red-500")
  })

  it("renders an outline heart icon when marked={false}", () => {
    render(<RecipeCard recipe={makeRecipe()} marked={false} />)

    const heart = screen.getByTestId("heart-icon")
    expect(heart).toBeInTheDocument()
    expect(heart).not.toHaveClass("fill-red-500")
  })

  it("renders no heart icon when marked is omitted", () => {
    render(<RecipeCard recipe={makeRecipe()} />)

    expect(screen.queryByTestId("heart-icon")).not.toBeInTheDocument()
  })
})
