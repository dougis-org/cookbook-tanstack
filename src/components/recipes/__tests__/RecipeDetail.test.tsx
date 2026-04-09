import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import type { Recipe } from "@/types/recipe"
import RecipeDetail, { splitLines } from "@/components/recipes/RecipeDetail"
import PrintButton from "@/components/ui/PrintButton"

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

  it("applies the shared print page-heading density tier to the recipe title", () => {
    render(<RecipeDetail recipe={makeRecipe({ name: "Pasta Carbonara" })} />)

    expect(screen.getByRole("heading", { name: "Pasta Carbonara" })).toHaveClass(
      "print-heading-density",
      "print-heading-density-page",
    )
  })

  it("renders notes when provided", () => {
    render(<RecipeDetail recipe={makeRecipe({ notes: "A classic Roman dish" })} />)

    expect(screen.getByText("A classic Roman dish")).toBeInTheDocument()
  })

  describe("notes section placement", () => {
    it("renders a Notes heading when notes are present", () => {
      render(<RecipeDetail recipe={makeRecipe({ notes: "Use fresh pasta" })} />)
      expect(screen.getByRole("heading", { name: "Notes" })).toBeInTheDocument()
    })

    it("renders note content alongside the Notes heading", () => {
      render(<RecipeDetail recipe={makeRecipe({ notes: "Use fresh pasta" })} />)
      expect(screen.getByText("Use fresh pasta")).toBeInTheDocument()
    })

    it("does not render a Notes heading when notes are absent", () => {
      render(<RecipeDetail recipe={makeRecipe({ notes: null })} />)
      expect(screen.queryByRole("heading", { name: "Notes" })).not.toBeInTheDocument()
    })

    it("does not render an empty Notes section when notes is an empty string", () => {
      render(<RecipeDetail recipe={makeRecipe({ notes: "" })} />)
      expect(screen.queryByRole("heading", { name: "Notes" })).not.toBeInTheDocument()
    })

    it("does not render a Notes section when notes is whitespace-only", () => {
      render(<RecipeDetail recipe={makeRecipe({ notes: "   " })} />)
      expect(screen.queryByRole("heading", { name: "Notes" })).not.toBeInTheDocument()
    })

    it("Notes section appears after Instructions in DOM order", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ instructions: "Boil water", notes: "Season well" })}
        />,
      )
      const headings = screen.getAllByRole("heading", { level: 2 })
      const instructionsIdx = headings.findIndex((h) => h.textContent?.trim() === "Instructions")
      const notesIdx = headings.findIndex((h) => h.textContent?.trim() === "Notes")
      expect(instructionsIdx).toBeGreaterThanOrEqual(0)
      expect(notesIdx).toBeGreaterThan(instructionsIdx)
    })

    it("Notes section appears before Nutrition when both are present", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ instructions: "Boil water", notes: "Season well", calories: 400 })}
        />,
      )
      const headings = screen.getAllByRole("heading", { level: 2 })
      const notesIdx = headings.findIndex((h) => h.textContent?.trim() === "Notes")
      const nutritionIdx = headings.findIndex((h) => h.textContent?.trim() === "Nutrition")
      expect(notesIdx).toBeGreaterThanOrEqual(0)
      expect(nutritionIdx).toBeGreaterThan(notesIdx)
    })

    it("notes are not rendered as unlabeled introductory text above recipe metadata", () => {
      render(<RecipeDetail recipe={makeRecipe({ notes: "Legacy top note" })} />)
      const noteText = screen.getByText("Legacy top note")
      // Note content must live inside a labeled <section>, not as a bare <p> before the meta grid
      expect(noteText.closest("section")).not.toBeNull()
    })
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

  it("applies the shared print section-heading density tier to recipe section headings", () => {
    render(
      <RecipeDetail
        recipe={makeRecipe({
          ingredients: "Spaghetti\nEggs\nPancetta",
          instructions: "Boil water\nCook pasta\nMix sauce",
          calories: 450,
          notes: "A classic Roman dish",
        })}
      />,
    )

    for (const headingName of ["Ingredients", "Instructions", "Nutrition", "Notes"]) {
      expect(screen.getByRole("heading", { name: headingName })).toHaveClass(
        "print-heading-density",
        "print-heading-density-section",
      )
    }
  })

  it("keeps note body copy separate from the shared print heading density classes", () => {
    render(
      <RecipeDetail
        recipe={makeRecipe({
          notes: "A classic Roman dish",
          ingredients: "Spaghetti",
          instructions: "Boil water",
        })}
      />,
    )

    expect(screen.getByText("A classic Roman dish")).not.toHaveClass(
      "print-heading-density",
      "print-heading-density-section",
      "print-heading-density-page",
    )

    const ingredientsHeading = screen.getByRole("heading", { name: "Ingredients" })
    expect(ingredientsHeading).toHaveClass("text-2xl", "mb-4")
    expect(ingredientsHeading).toHaveClass(
      "print-heading-density",
      "print-heading-density-section",
    )
  })

  it("hides nutrition panel when no data exists", () => {
    render(<RecipeDetail recipe={makeRecipe()} />)

    expect(screen.queryByText("Nutrition")).not.toBeInTheDocument()
  })

  it.each([
    { label: "renders classification badge when name is provided", classificationName: "Italian",   visible: true  },
    { label: "omits classification badge when name is absent",     classificationName: null,        visible: false },
  ])("$label", ({ classificationName, visible }) => {
    render(
      <RecipeDetail
        recipe={{ ...makeRecipe({ classificationId: "cat-1" }), classificationName: classificationName ?? undefined }}
      />,
    )
    const el = screen.queryByText("Italian")
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

  it("chiclet wrapper has print:hidden class", () => {
    render(
      <RecipeDetail
        recipe={{
          ...makeRecipe({ classificationId: "cat-1" }),
          classificationName: "Italian",
          meals: [{ id: "m1", name: "Breakfast" }],
        }}
      />,
    )
    expect(screen.getByTestId("chiclet-wrapper")).toHaveClass("print:hidden")
  })

  it("recipe with no chiclets renders no chiclet wrapper", () => {
    render(<RecipeDetail recipe={makeRecipe()} />)
    expect(screen.queryByTestId("chiclet-wrapper")).not.toBeInTheDocument()
  })

  describe("source and chiclet DOM order", () => {
    it("source renders before chiclet wrapper when recipe has both source and taxonomy", () => {
      render(
        <RecipeDetail
          recipe={{
            ...makeRecipe(),
            sourceName: "Bon Appétit",
            sourceUrl: "https://bonappetit.com",
            meals: [{ id: "m1", name: "Breakfast" }],
          }}
        />,
      )
      const source = screen.getByText(/source:/i).closest("p")!
      const chicletWrapper = screen.getByTestId("chiclet-wrapper")
      // source precedes chiclet wrapper in the DOM
      expect(source.compareDocumentPosition(chicletWrapper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it("source renders when recipe has source but no taxonomy tags", () => {
      render(<RecipeDetail recipe={{ ...makeRecipe(), sourceName: "Grandma's Cookbook" }} />)
      expect(screen.getByText("Grandma's Cookbook")).toBeInTheDocument()
      expect(screen.queryByTestId("chiclet-wrapper")).not.toBeInTheDocument()
    })
  })

  describe("title-source inner wrapper", () => {
    it("inner wrapper has print flex-row classes", () => {
      render(<RecipeDetail recipe={makeRecipe()} />)
      const wrapper = screen.getByTestId("title-source-wrapper")
      expect(wrapper).toHaveClass("print:flex-row")
      expect(wrapper).toHaveClass("print:items-baseline")
      expect(wrapper).toHaveClass("print:justify-between")
    })

    it("inner wrapper renders without source child when sourceName is absent", () => {
      render(<RecipeDetail recipe={makeRecipe()} />)
      const wrapper = screen.getByTestId("title-source-wrapper")
      expect(wrapper.querySelector("p")).toBeNull()
    })

    it("source element retains text-sm class", () => {
      render(<RecipeDetail recipe={{ ...makeRecipe(), sourceName: "Bon Appétit" }} />)
      const sourceP = screen.getByText(/source:/i).closest("p")!
      expect(sourceP).toHaveClass("text-sm")
    })
  })

  describe("actions wrapper print visibility", () => {
    it("actions wrapper div has print:hidden class", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe()}
          actions={<button data-testid="edit-btn">Edit</button>}
        />,
      )
      const actionsWrapper = screen.getByTestId("edit-btn").parentElement!
      expect(actionsWrapper).toHaveClass("print:hidden")
    })

    it("does not render actions content when actions prop is absent", () => {
      render(<RecipeDetail recipe={makeRecipe({ name: "Pasta" })} />)
      expect(screen.getByRole("heading", { name: "Pasta" })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument()
    })
  })

  describe("actions prop", () => {
    it("renders provided actions content in the title row", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ name: "Pasta" })}
          actions={<a href="/edit" data-testid="edit-link">Edit Recipe</a>}
        />,
      )
      expect(screen.getByTestId("edit-link")).toBeInTheDocument()
    })

    it("renders the recipe name alongside the actions", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ name: "Pasta" })}
          actions={<button>Edit</button>}
        />,
      )
      expect(screen.getByText("Pasta")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
    })

    it("renders normally when no actions prop is provided", () => {
      render(<RecipeDetail recipe={makeRecipe({ name: "Pasta" })} />)
      expect(screen.getByText("Pasta")).toBeInTheDocument()
    })
  })

  describe("serving controls", () => {
    it("renders controls adjacent to the Servings label in the meta grid, not in Ingredients", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ servings: 4, ingredients: "2 cups flour\n1 egg" })}
        />,
      )

      const servingsLabel = screen.getByText("Servings")
      const servingsCell = servingsLabel.parentElement
      expect(servingsCell).not.toBeNull()
      expect(within(servingsCell!).getByRole("button", { name: /increase servings/i })).toBeInTheDocument()
      expect(within(servingsCell!).getByRole("button", { name: /decrease servings/i })).toBeInTheDocument()

      const ingredientsHeading = screen.getByRole("heading", { name: "Ingredients" })
      const ingredientsSection = ingredientsHeading.closest("section")
      expect(ingredientsSection).not.toBeNull()
      expect(within(ingredientsSection!).queryByRole("button", { name: /increase servings/i })).not.toBeInTheDocument()
      expect(within(ingredientsSection!).queryByRole("button", { name: /decrease servings/i })).not.toBeInTheDocument()
    })

    it("does not render reset at the default serving count", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ servings: 4, ingredients: "2 cups flour\n1 egg" })}
        />,
      )

      expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument()
    })

    it("shows reset after increasing servings", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ servings: 4, ingredients: "2 cups flour\n1 egg" })}
        />,
      )

      fireEvent.click(screen.getByRole("button", { name: /increase servings/i }))

      expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument()
    })

    it("resets the serving count and hides reset after clicking Reset", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ servings: 4, ingredients: "2 cups flour\n1 egg" })}
        />,
      )

      fireEvent.click(screen.getByRole("button", { name: /increase servings/i }))
      fireEvent.click(screen.getByRole("button", { name: /reset/i }))

      const servingsLabel = screen.getByText("Servings")
      const servingsCell = servingsLabel.parentElement
      expect(servingsCell).not.toBeNull()
      expect(within(servingsCell!).getByText("4")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument()
    })

    it("scales ingredient quantities after increasing servings", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ servings: 2, ingredients: "2 cups flour\n1 egg" })}
        />,
      )

      fireEvent.click(screen.getByRole("button", { name: /increase servings/i }))

      expect(screen.getByText("3 cups flour")).toBeInTheDocument()
    })

    it("applies print:hidden to decrease, increase, and reset buttons", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ servings: 2, ingredients: "2 cups flour\n1 egg" })}
        />,
      )

      const decreaseButton = screen.getByRole("button", { name: /decrease servings/i })
      const increaseButton = screen.getByRole("button", { name: /increase servings/i })
      expect(decreaseButton).toHaveClass("print:hidden")
      expect(increaseButton).toHaveClass("print:hidden")

      fireEvent.click(increaseButton)
      expect(screen.getByRole("button", { name: /reset/i })).toHaveClass("print:hidden")
    })

    it("renders N/A and no controls when servings is undefined", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ servings: undefined, ingredients: "2 cups flour\n1 egg" })}
        />,
      )

      const servingsLabel = screen.getByText("Servings")
      const servingsCell = servingsLabel.parentElement
      expect(servingsCell).not.toBeNull()
      expect(within(servingsCell!).getByText("N/A")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /increase servings/i })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /decrease servings/i })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument()
    })

    it("resets currentServings when the recipe id changes", () => {
      const { rerender } = render(
        <RecipeDetail
          recipe={makeRecipe({ id: "recipe-a", servings: 2, ingredients: "2 cups flour\n1 egg" })}
        />,
      )

      fireEvent.click(screen.getByRole("button", { name: /increase servings/i }))
      expect(screen.getByText("3 cups flour")).toBeInTheDocument()

      rerender(
        <RecipeDetail
          recipe={makeRecipe({ id: "recipe-b", servings: 4, ingredients: "4 cups flour\n2 eggs" })}
        />,
      )

      const servingsLabel = screen.getByText("Servings")
      const servingsCell = servingsLabel.parentElement
      expect(servingsCell).not.toBeNull()
      expect(within(servingsCell!).getByText("4")).toBeInTheDocument()
      expect(screen.getByText("4 cups flour")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument()
    })
  })

  it.each([
    { label: "null imageUrl", imageUrl: null },
    { label: "empty string imageUrl", imageUrl: "" },
  ])("does not render image section when imageUrl is $label", ({ imageUrl }) => {
    render(<RecipeDetail recipe={makeRecipe({ imageUrl })} />)

    expect(screen.queryByTestId("recipe-detail-image")).not.toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.queryByText("No Image Available")).not.toBeInTheDocument()
  })

  it("renders image section and img when imageUrl is provided", () => {
    render(<RecipeDetail recipe={makeRecipe({ imageUrl: "https://example.com/photo.jpg", name: "Pasta" })} />)

    expect(screen.getByTestId("recipe-detail-image")).toBeInTheDocument()
    const img = screen.getByRole("img", { name: "Pasta" })
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg")
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

describe("splitLines", () => {
  it("returns [] for null input", () => {
    expect(splitLines(null)).toEqual([])
  })

  it("returns [] for empty string", () => {
    expect(splitLines("")).toEqual([])
  })

  it("returns [] for whitespace-only string", () => {
    expect(splitLines("   \n  \n  ")).toEqual([])
  })

  it("returns non-empty lines unchanged when no blank lines present", () => {
    expect(splitLines("apple\nbanana\ncherry")).toEqual(["apple", "banana", "cherry"])
  })

  it("preserves a single internal blank line as ''", () => {
    expect(splitLines("apple\n\nbanana")).toEqual(["apple", "", "banana"])
  })

  it("collapses consecutive internal blank lines to a single ''", () => {
    expect(splitLines("apple\n\n\n\nbanana")).toEqual(["apple", "", "banana"])
  })

  it("trims leading blank lines", () => {
    expect(splitLines("\n\napple\nbanana")).toEqual(["apple", "banana"])
  })

  it("trims trailing blank lines", () => {
    expect(splitLines("apple\nbanana\n\n")).toEqual(["apple", "banana"])
  })

  it("trims both leading and trailing blank lines, preserves internal", () => {
    expect(splitLines("\napple\n\nbanana\n")).toEqual(["apple", "", "banana"])
  })
})

describe("RecipeDetail — print button in actions slot", () => {
  beforeEach(() => {
    vi.spyOn(window, "print").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("actions slot renders Print+Edit", () => {
    render(
      <RecipeDetail
        recipe={makeRecipe()}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <PrintButton />
            <a href="/edit">Edit Recipe</a>
          </div>
        }
      />,
    )
    expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Edit Recipe" })).toBeInTheDocument()
  })

  it("actions slot renders Print only", () => {
    render(
      <RecipeDetail
        recipe={makeRecipe()}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <PrintButton />
          </div>
        }
      />,
    )
    expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Edit Recipe" })).not.toBeInTheDocument()
  })

  it("actions wrapper carries print:hidden so the group is absent during printing", () => {
    const { container } = render(
      <RecipeDetail
        recipe={makeRecipe()}
        actions={
          <div className="flex items-center gap-2 print:hidden" data-testid="actions-group">
            <PrintButton />
          </div>
        }
      />,
    )
    const wrapper = container.querySelector('[data-testid="actions-group"]')
    expect(wrapper).toHaveClass("print:hidden")
  })
})

describe("RecipeDetail — blank line rendering", () => {
  describe("ingredients with blank lines", () => {
    it("renders a spacer li for a blank-line entry", () => {
      const { container } = render(
        <RecipeDetail
          recipe={makeRecipe({ ingredients: "Flour\n\nSugar" })}
        />,
      )
      const spacers = container.querySelectorAll("li.recipe-ingredient-spacer")
      expect(spacers).toHaveLength(1)
    })

    it("spacer li has no bullet marker or text content", () => {
      const { container } = render(
        <RecipeDetail
          recipe={makeRecipe({ ingredients: "Flour\n\nSugar" })}
        />,
      )
      const spacer = container.querySelector("li.recipe-ingredient-spacer")!
      expect(spacer.querySelector("span")).toBeNull()
      expect(spacer.textContent).toBe("")
    })

    it("content items still render normally alongside spacers", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ ingredients: "Flour\n\nSugar" })}
        />,
      )
      expect(screen.getByText("Flour")).toBeInTheDocument()
      expect(screen.getByText("Sugar")).toBeInTheDocument()
    })
  })

  describe("instructions with blank lines", () => {
    it("renders a spacer li for a blank-line entry", () => {
      const { container } = render(
        <RecipeDetail
          recipe={makeRecipe({ instructions: "Boil water\n\nAdd pasta" })}
        />,
      )
      const spacers = container.querySelectorAll("li.recipe-instruction-spacer")
      expect(spacers).toHaveLength(1)
    })

    it("step numbers are contiguous across spacers (1, 2, not 1, 3)", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ instructions: "Boil water\n\nAdd pasta\nDrain" })}
        />,
      )
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
      expect(screen.queryByText("4")).not.toBeInTheDocument()
    })

    it("spacer li has no step number circle", () => {
      const { container } = render(
        <RecipeDetail
          recipe={makeRecipe({ instructions: "Step one\n\nStep two" })}
        />,
      )
      const spacer = container.querySelector("li.recipe-instruction-spacer")!
      expect(spacer.querySelector("span")).toBeNull()
      expect(spacer.textContent).toBe("")
    })
  })

  describe("servings with blank-line entries", () => {
    it("scales correctly when ingredient array contains '' entries", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ servings: 2, ingredients: "2 cups flour\n\n1 cup sugar" })}
        />,
      )
      expect(screen.getByRole("button", { name: /increase servings/i })).toBeInTheDocument()
      expect(screen.getByText("2 cups flour")).toBeInTheDocument()
      expect(screen.getByText("1 cup sugar")).toBeInTheDocument()
    })
  })
})
