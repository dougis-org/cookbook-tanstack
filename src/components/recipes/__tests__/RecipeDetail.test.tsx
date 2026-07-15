import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import type { Recipe } from "@/types/recipe"
import RecipeDetail, { splitLines } from "@/components/recipes/RecipeDetail"
import PrintButton from "@/components/ui/PrintButton"
import { PRINT_HEADING_DENSITY_PAGE, PRINT_HEADING_DENSITY_SECTION } from "@/components/printHeadingDensity"

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
          actions={<button>Edit</button>}
        />,
      )
      const actionsWrapper = screen.getByTestId("actions-wrapper")
      expect(actionsWrapper).toHaveClass("print:hidden")
    })

    it("no actions wrapper rendered when actions prop is absent", () => {
      render(<RecipeDetail recipe={makeRecipe({ name: "Pasta" })} />)
      expect(screen.getByRole("heading", { name: "Pasta" })).toBeInTheDocument()
      expect(screen.queryByTestId("actions-wrapper")).not.toBeInTheDocument()
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

  describe("printFooter prop", () => {
    it("renders no extra content when printFooter is omitted", () => {
      const { container } = render(<RecipeDetail recipe={makeRecipe({ name: "Pasta" })} />)
      expect(screen.getByText("Pasta")).toBeInTheDocument()
      expect(container.querySelector('[data-testid="recipe-footer"]')).not.toBeInTheDocument()
    })

    it("renders a passed printFooter node inside the recipe's content container", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ name: "Pasta" })}
          printFooter={<div data-testid="recipe-footer">#1</div>}
        />,
      )
      const footer = screen.getByTestId("recipe-footer")
      const contentContainer = screen.getByText("Pasta").closest("div.p-8")
      expect(contentContainer).toContainElement(footer)
    })
  })

  describe("card chrome print suppression", () => {
    it("outer card wrapper has print-scoped overrides removing background, rounding, and shadow", () => {
      const { container } = render(<RecipeDetail recipe={makeRecipe({ name: "Pasta" })} />)
      const card = container.querySelector("div.p-8")?.parentElement
      expect(card).toHaveClass(
        "print:bg-transparent",
        "print:rounded-none",
        "print:shadow-none",
      )
    })

    it("outer card wrapper retains screen-mode chrome classes", () => {
      const { container } = render(<RecipeDetail recipe={makeRecipe({ name: "Pasta" })} />)
      const card = container.querySelector("div.p-8")?.parentElement
      expect(card).toHaveClass(
        "bg-[var(--theme-surface)]",
        "rounded-lg",
        "shadow-lg",
      )
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
      label: "as a link when sourceUrl is provided with https",
      props: { sourceName: "Bon Appétit", sourceUrl: "https://bonappetit.com" },
      assert: () => {
        const link = screen.getByRole("link", { name: "Bon Appétit" })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute("href", "https://bonappetit.com")
      },
    },
    {
      label: "as a link when sourceUrl is provided with http",
      props: { sourceName: "Bon Appétit", sourceUrl: "http://bonappetit.com" },
      assert: () => {
        expect(screen.getByRole("link", { name: "Bon Appétit" })).toBeInTheDocument()
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
      label: "as plain text when sourceUrl uses a javascript: scheme",
      props: { sourceName: "Evil Source", sourceUrl: "javascript:alert(1)" },
      assert: () => {
        expect(screen.getByText("Evil Source")).toBeInTheDocument()
        expect(screen.queryByRole("link", { name: "Evil Source" })).not.toBeInTheDocument()
      },
    },
    {
      label: "as plain text when sourceUrl uses a data: scheme",
      props: { sourceName: "Evil Source", sourceUrl: "data:text/html,<script>alert(1)</script>" },
      assert: () => {
        expect(screen.getByText("Evil Source")).toBeInTheDocument()
        expect(screen.queryByRole("link", { name: "Evil Source" })).not.toBeInTheDocument()
      },
    },
    {
      label: "not at all when sourceName is absent",
      props: {},
      assert: () => expect(screen.queryByText(/source:/i)).not.toBeInTheDocument(),
    },
    {
      label: "with personal source name suffix when personalSourceName is present",
      props: { sourceName: "Personal", sourceUrl: null, personalSourceName: "Doug's Recipes" },
      assert: () => {
        const sourceP = screen.getByText(/source:/i).closest("p")!
        expect(sourceP.textContent).toBe("Source: Personal · Doug's Recipes")
      },
    },
    {
      label: "without suffix when personalSourceName is absent/undefined",
      props: { sourceName: "Personal", sourceUrl: null, personalSourceName: undefined },
      assert: () => {
        const sourceP = screen.getByText(/source:/i).closest("p")!
        expect(sourceP.textContent).toBe("Source: Personal")
      },
    },
    {
      label: "without suffix when personalSourceName is whitespace-only",
      props: { sourceName: "Personal", sourceUrl: null, personalSourceName: "   " },
      assert: () => {
        const sourceP = screen.getByText(/source:/i).closest("p")!
        expect(sourceP.textContent).toBe("Source: Personal")
      },
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

describe("RecipeDetail — compact print meta line", () => {
  describe("TC-1: meta grid has print:hidden class (FR1)", () => {
    it("meta grid container has the print:hidden class", () => {
      const { container } = render(<RecipeDetail recipe={makeRecipe()} />)
      const grid = container.querySelector(".grid.grid-cols-2")
      expect(grid).not.toBeNull()
      expect(grid).toHaveClass("print:hidden")
    })
  })

  describe("TC-2: compact print line has hidden and print:block classes (FR2)", () => {
    it("print-meta-line element has hidden and print:block classes", () => {
      render(<RecipeDetail recipe={makeRecipe({ difficulty: "easy" })} />)
      const line = screen.getByTestId("print-meta-line")
      expect(line).toHaveClass("hidden")
      expect(line).toHaveClass("print:block")
    })
  })

  describe("TC-3: compact line content, all fields present (FR3)", () => {
    it("shows all fields joined by · when all meta fields are set", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ prepTime: 15, cookTime: 30, servings: 4, difficulty: "medium" })}
        />,
      )
      const line = screen.getByTestId("print-meta-line")
      expect(line.textContent).toBe("Prep: 15m · Cook: 30m · Serves: 4 · Medium")
    })
  })

  describe("TC-4: compact line content, partial fields (FR3 edge)", () => {
    it("shows N/A for a null field and joins with the present fields", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ prepTime: 20, cookTime: null, servings: null, difficulty: "easy" })}
        />,
      )
      const line = screen.getByTestId("print-meta-line")
      expect(line.textContent).toBe("Prep: 20m · Cook: N/A · Easy")
      expect(line.textContent).not.toContain("Serves:")
    })
  })

  describe("TC-5: all fields null (FR4)", () => {
    it("still renders print-meta-line showing N/A for prep/cook time when all meta fields are null", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ prepTime: null, cookTime: null, servings: null, difficulty: null })}
        />,
      )
      const line = screen.getByTestId("print-meta-line")
      expect(line.textContent).toBe("Prep: N/A · Cook: N/A")
    })
  })

  describe("TC-6: single field present (FR4)", () => {
    it("shows N/A for the missing prep time alongside the present cook time", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ prepTime: null, cookTime: 45, servings: null, difficulty: null })}
        />,
      )
      const line = screen.getByTestId("print-meta-line")
      expect(line.textContent).toBe("Prep: N/A · Cook: 45m")
    })
  })

  describe("TC-7: zero prepTime/cookTime is treated as N/A (0 == N/A)", () => {
    it("shows N/A for prepTime and cookTime when they are 0", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ prepTime: 0, cookTime: 0, servings: 4, difficulty: "easy" })}
        />,
      )
      const line = screen.getByTestId("print-meta-line")
      expect(line.textContent).toBe("Prep: N/A · Cook: N/A · Serves: 4 · Easy")
    })
  })

  describe("TC-8: print meta line reflects currentServings after scaling", () => {
    it("shows scaled serving count after user increments servings", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ servings: 4, difficulty: "easy" })}
        />,
      )
      fireEvent.click(screen.getByRole("button", { name: /increase servings/i }))
      const line = screen.getByTestId("print-meta-line")
      expect(line.textContent).toContain("Serves: 5")
    })
  })

  describe("TC-9: recipe attribution (addedByName) in print meta line", () => {
    it("renders Added by: [addedByName] when present", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ servings: 4, difficulty: "easy", addedByName: "Alice" })}
        />,
      )
      const line = screen.getByTestId("print-meta-line")
      expect(line.textContent).toBe("Prep: N/A · Cook: N/A · Serves: 4 · Easy · Added by: Alice")
    })

    it("does not render Added by section when addedByName is absent/null", () => {
      render(
        <RecipeDetail
          recipe={makeRecipe({ servings: 4, difficulty: "easy", addedByName: null })}
        />,
      )
      const line = screen.getByTestId("print-meta-line")
      expect(line.textContent).toBe("Prep: N/A · Cook: N/A · Serves: 4 · Easy")
      expect(line.textContent).not.toContain("Added by:")
    })
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

describe("RecipeDetail — print density (recipe-print-density-2026-04-09)", () => {
  describe("printHeadingDensity constants", () => {
    it("PRINT_HEADING_DENSITY_PAGE includes print:text-xl", () => {
      expect(PRINT_HEADING_DENSITY_PAGE).toContain("print:text-xl")
    })

    it("PRINT_HEADING_DENSITY_PAGE does NOT include print:text-2xl", () => {
      expect(PRINT_HEADING_DENSITY_PAGE).not.toContain("print:text-2xl")
    })

    it("PRINT_HEADING_DENSITY_SECTION includes print:text-lg", () => {
      expect(PRINT_HEADING_DENSITY_SECTION).toContain("print:text-lg")
    })

    it("PRINT_HEADING_DENSITY_SECTION does NOT include print:text-xl", () => {
      expect(PRINT_HEADING_DENSITY_SECTION).not.toContain("print:text-xl")
    })
  })

  describe("ingredient <ul> print classes", () => {
    it("ingredient <ul> includes print:columns-2", () => {
      const { container } = render(
        <RecipeDetail recipe={makeRecipe({ ingredients: "Flour\nSugar\nEggs" })} />,
      )
      const ul = container.querySelector("ul.print\\:columns-2")
      expect(ul).not.toBeNull()
    })

    it("ingredient <ul> includes print:gap-x-8", () => {
      const { container } = render(
        <RecipeDetail recipe={makeRecipe({ ingredients: "Flour\nSugar\nEggs" })} />,
      )
      const ul = container.querySelector("ul.print\\:gap-x-8")
      expect(ul).not.toBeNull()
    })

    it("ingredient <ul> includes print:space-y-1", () => {
      const { container } = render(
        <RecipeDetail recipe={makeRecipe({ ingredients: "Flour\nSugar\nEggs" })} />,
      )
      const ul = container.querySelector("ul.print\\:space-y-1")
      expect(ul).not.toBeNull()
    })

    it("empty ingredient list renders fallback without error and without print column ul", () => {
      const { container } = render(<RecipeDetail recipe={makeRecipe({ ingredients: null })} />)
      expect(screen.getByText("No ingredients listed")).toBeInTheDocument()
      expect(container.querySelector("ul.print\\:columns-2")).toBeNull()
    })
  })

  describe("section print:mb-4 classes", () => {
    it("Ingredients <section> includes print:mb-4", () => {
      render(<RecipeDetail recipe={makeRecipe({ ingredients: "Flour\nSugar" })} />)
      const heading = screen.getByRole("heading", { name: "Ingredients" })
      const section = heading.closest("section")
      expect(section).not.toBeNull()
      expect(section).toHaveClass("print:mb-4")
    })

    it("Instructions <section> includes print:mb-4", () => {
      render(<RecipeDetail recipe={makeRecipe({ instructions: "Boil water" })} />)
      const heading = screen.getByRole("heading", { name: "Instructions" })
      const section = heading.closest("section")
      expect(section).not.toBeNull()
      expect(section).toHaveClass("print:mb-4")
    })

    it("Notes <section> includes print:mb-4 when notes are present", () => {
      render(<RecipeDetail recipe={makeRecipe({ notes: "Season well" })} />)
      const heading = screen.getByRole("heading", { name: "Notes" })
      const section = heading.closest("section")
      expect(section).not.toBeNull()
      expect(section).toHaveClass("print:mb-4")
    })

    it("Nutrition <section> includes print:mb-4 when nutrition is present", () => {
      render(<RecipeDetail recipe={makeRecipe({ calories: 400 })} />)
      const heading = screen.getByRole("heading", { name: "Nutrition" })
      const section = heading.closest("section")
      expect(section).not.toBeNull()
      expect(section).toHaveClass("print:mb-4")
    })
  })

  describe("instruction step print classes (remove-print-instruction-numbering)", () => {
    it("instructions <ol> includes print:space-y-1 alongside space-y-4", () => {
      const { container } = render(
        <RecipeDetail recipe={makeRecipe({ instructions: "Boil water\nCook pasta\nMix sauce" })} />,
      )
      const ol = container.querySelector("ol")
      expect(ol).not.toBeNull()
      expect(ol).toHaveClass("space-y-4", "print:space-y-1")
    })

    it("instruction step number badge <span> has print:hidden", () => {
      const { container } = render(
        <RecipeDetail recipe={makeRecipe({ instructions: "Boil water\nCook pasta" })} />,
      )
      const badge = container.querySelector("li.recipe-instruction-step span")
      expect(badge).not.toBeNull()
      expect(badge).toHaveClass("print:hidden")
    })

    it("instruction step badge still renders step number and screen classes unchanged", () => {
      const { container } = render(
        <RecipeDetail recipe={makeRecipe({ instructions: "Boil water\nCook pasta" })} />,
      )
      const badge = container.querySelector("li.recipe-instruction-step span")
      if (!badge) throw new Error("expected instruction step badge to be present")
      expect(badge.textContent).toBe("1")
      expect(badge).toHaveClass(
        "w-8",
        "h-8",
        "bg-[var(--theme-accent)]",
        "text-white",
        "rounded-full",
        "flex",
        "items-center",
        "justify-center",
        "font-semibold",
      )
    })

    it("instruction step <li> has print:block override and step <p> has print:pt-0", () => {
      const { container } = render(
        <RecipeDetail recipe={makeRecipe({ instructions: "Boil water\nCook pasta" })} />,
      )
      const li = container.querySelector("li.recipe-instruction-step")
      if (!li) throw new Error("expected instruction step <li> to be present")
      expect(li).toHaveClass("flex", "gap-4", "print:block")

      const paragraph = li.querySelector("p")
      if (!paragraph) throw new Error("expected instruction step <p> to be present")
      expect(paragraph).toHaveClass("flex-1", "pt-1", "print:pt-0")
    })

    it("spacer <li> is unaffected: no print classes, no badge", () => {
      const { container } = render(
        <RecipeDetail recipe={makeRecipe({ instructions: "Boil water\n\nCook pasta" })} />,
      )
      const spacer = container.querySelector("li.recipe-instruction-spacer")
      if (!spacer) throw new Error("expected spacer <li> to be present")
      expect(spacer).toHaveClass("recipe-instruction-spacer", "h-2")
      expect(Array.from(spacer.classList).some((c) => c.startsWith("print:"))).toBe(false)
      expect(spacer.querySelector("span")).toBeNull()
    })
  })
})

describe("RecipeDetail — shared print list item marker (unify-print-list-item-styling)", () => {
  it("ingredient <li> carries the print-list-item class", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ ingredients: "Flour\nSugar" })} />,
    )
    const li = container.querySelector("li.recipe-ingredient-item")
    expect(li).not.toBeNull()
    expect(li).toHaveClass("print-list-item")
  })

  it("instruction <li> carries the print-list-item class", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ instructions: "Boil water\nCook pasta" })} />,
    )
    const li = container.querySelector("li.recipe-instruction-step")
    expect(li).not.toBeNull()
    expect(li).toHaveClass("print-list-item")
  })

  it("ingredient spacer <li> does not carry the print-list-item class", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ ingredients: "Flour\n\nSugar" })} />,
    )
    const spacer = container.querySelector("li.recipe-ingredient-spacer")
    expect(spacer).not.toBeNull()
    expect(spacer).not.toHaveClass("print-list-item")
  })

  it("instruction spacer <li> does not carry the print-list-item class", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ instructions: "Boil water\n\nCook pasta" })} />,
    )
    const spacer = container.querySelector("li.recipe-instruction-spacer")
    expect(spacer).not.toBeNull()
    expect(spacer).not.toHaveClass("print-list-item")
  })

  it("existing ingredient dot span carries print:hidden", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ ingredients: "Flour\nSugar" })} />,
    )
    const dot = container.querySelector("li.recipe-ingredient-item span")
    expect(dot).not.toBeNull()
    expect(dot).toHaveClass("print:hidden")
  })

  it("ingredient dot span retains its existing on-screen classes unchanged", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ ingredients: "Flour\nSugar" })} />,
    )
    const dot = container.querySelector("li.recipe-ingredient-item span")
    expect(dot).not.toBeNull()
    expect(dot).toHaveClass(
      "w-2",
      "h-2",
      "bg-[var(--theme-accent)]",
      "rounded-full",
      "mr-3",
      "shrink-0",
    )
  })

  it("instruction numbered-circle span still carries print:hidden (unchanged)", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ instructions: "Boil water\nCook pasta" })} />,
    )
    const badge = container.querySelector("li.recipe-instruction-step span")
    expect(badge).not.toBeNull()
    expect(badge).toHaveClass("print:hidden")
  })

  it("instruction <ol> still carries print:space-y-1 (vertical spacing unchanged)", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ instructions: "Boil water\nCook pasta" })} />,
    )
    const ol = container.querySelector("ol")
    expect(ol).not.toBeNull()
    expect(ol).toHaveClass("print:space-y-1")
  })

  it("ingredient <ul> remains two-column in print (print:columns-2)", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ ingredients: "Flour\nSugar" })} />,
    )
    const ul = container.querySelector("ul")
    expect(ul).not.toBeNull()
    expect(ul).toHaveClass("print:columns-2")
  })

  it("instruction <ol> has no columns utility class (remains single-column)", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ instructions: "Boil water\nCook pasta" })} />,
    )
    const ol = container.querySelector("ol")
    expect(ol).not.toBeNull()
    expect(Array.from(ol!.classList).some((c) => c.includes("columns"))).toBe(false)
  })

  it("ingredient <li> retains its existing non-print classes unchanged", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ ingredients: "Flour\nSugar" })} />,
    )
    const li = container.querySelector("li.recipe-ingredient-item")
    expect(li).not.toBeNull()
    expect(li).toHaveClass("flex", "items-center", "text-[var(--theme-fg-muted)]")
  })

  it("instruction <li> retains its existing non-print classes unchanged", () => {
    const { container } = render(
      <RecipeDetail recipe={makeRecipe({ instructions: "Boil water\nCook pasta" })} />,
    )
    const li = container.querySelector("li.recipe-instruction-step")
    expect(li).not.toBeNull()
    expect(li).toHaveClass("flex", "gap-4", "print:block", "text-[var(--theme-fg-muted)]")
  })
})
