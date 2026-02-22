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

  it.each([
    ["renders badge",       { classificationId: "cat-1" }, "Italian",  true ],
    ["omits badge without name", { classificationId: "cat-1" }, "Italian", false],
  ])("%s when classificationName is %s", (_label, recipeOverrides, text, visible) => {
    const extra = visible ? { classificationName: text } : {}
    render(<RecipeDetail recipe={{ ...makeRecipe(recipeOverrides), ...extra }} />)
    const el = screen.queryByText(text)
    visible ? expect(el).toBeInTheDocument() : expect(el).not.toBeInTheDocument()
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

    for (const name of ["Breakfast", "Entree", "Bake"]) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it.each([
    {
      label: "as a link when sourceUrl is provided",
      props: { sourceName: "Bon Appétit", sourceUrl: "https://bonappetit.com" },
      assert: () => {
        const link = screen.getByRole("link", { name: "Bon Appétit" })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute("href", "https://bonappetit.com")
      },
    },
    {
      label: "as plain text when sourceUrl is absent",
      props: { sourceName: "Grandma's Cookbook", sourceUrl: null },
      assert: () => {
        expect(screen.getByText("Grandma's Cookbook")).toBeInTheDocument()
        expect(screen.queryByRole("link", { name: "Grandma's Cookbook" })).not.toBeInTheDocument()
      },
    },
    {
      label: "not at all when sourceName is absent",
      props: {},
      assert: () => expect(screen.queryByText(/source:/i)).not.toBeInTheDocument(),
    },
  ])("renders source $label", ({ props, assert }) => {
    render(<RecipeDetail recipe={{ ...makeRecipe(), ...props }} />)
    assert()
  })
})
