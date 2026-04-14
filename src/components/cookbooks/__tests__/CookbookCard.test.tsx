import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import CookbookCard from "@/components/cookbooks/CookbookCard"

function makeCookbook(overrides: Partial<Parameters<typeof CookbookCard>[0]["cookbook"]> = {}) {
  return {
    id: "cb-1",
    name: "My Cookbook",
    description: null,
    isPublic: true,
    imageUrl: null,
    recipeCount: 0,
    chapterCount: 0,
    ...overrides,
  }
}

describe("CookbookCard", () => {
  it("renders cookbook name", () => {
    render(<CookbookCard cookbook={makeCookbook({ name: "Italian Classics" })} />)
    expect(screen.getByText("Italian Classics")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(<CookbookCard cookbook={makeCookbook({ description: "Pasta and more" })} />)
    expect(screen.getByText("Pasta and more")).toBeInTheDocument()
  })

  it("does not render description section when null", () => {
    render(<CookbookCard cookbook={makeCookbook({ description: null })} />)
    expect(screen.queryByText(/Pasta/)).not.toBeInTheDocument()
  })

  it("renders recipe count as '0 recipes' by default", () => {
    render(<CookbookCard cookbook={makeCookbook({ recipeCount: 0 })} />)
    expect(screen.getByText("0 recipes")).toBeInTheDocument()
  })

  it("renders singular 'recipe' for count of 1", () => {
    render(<CookbookCard cookbook={makeCookbook({ recipeCount: 1 })} />)
    expect(screen.getByText("1 recipe")).toBeInTheDocument()
  })

  it("renders plural 'recipes' for count > 1", () => {
    render(<CookbookCard cookbook={makeCookbook({ recipeCount: 5 })} />)
    expect(screen.getByText("5 recipes")).toBeInTheDocument()
  })

  it("renders cookbook image when imageUrl is provided", () => {
    render(<CookbookCard cookbook={makeCookbook({ imageUrl: "https://example.com/img.jpg", name: "Photo Cookbook" })} />)
    const img = screen.getByRole("img", { name: "Photo Cookbook" })
    expect(img).toHaveAttribute("src", "https://example.com/img.jpg")
  })

  it("renders no image header when imageUrl is null", () => {
    render(<CookbookCard cookbook={makeCookbook({ imageUrl: null })} />)
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("renders BookOpen icon in title area when imageUrl is null", () => {
    render(<CookbookCard cookbook={makeCookbook({ imageUrl: null, name: "No Photo" })} />)
    const heading = screen.getByText("No Photo").closest("h3")
    expect(heading?.querySelector("svg")).toBeInTheDocument()
  })

  it("does not render BookOpen icon in title when imageUrl is provided", () => {
    render(<CookbookCard cookbook={makeCookbook({ imageUrl: "https://example.com/img.jpg", name: "Photo Cookbook" })} />)
    const heading = screen.getByText("Photo Cookbook").closest("h3")
    expect(heading?.querySelector("svg")).not.toBeInTheDocument()
  })

  it("shows Private badge in card body for non-public cookbooks", () => {
    render(<CookbookCard cookbook={makeCookbook({ isPublic: false })} />)
    const badge = screen.getByText("Private")
    expect(badge).toBeInTheDocument()
    // Badge should be in the card body (p-4 div), not an image overlay
    expect(badge.closest(".p-4")).toBeInTheDocument()
  })

  it("does not show Private badge for public cookbooks", () => {
    render(<CookbookCard cookbook={makeCookbook({ isPublic: true })} />)
    expect(screen.queryByText("Private")).not.toBeInTheDocument()
  })

  it("shows only recipe count when chapterCount is 0", () => {
    render(<CookbookCard cookbook={makeCookbook({ recipeCount: 5, chapterCount: 0 })} />)
    expect(screen.getByText("5 recipes")).toBeInTheDocument()
    expect(screen.queryByText(/chapter/)).not.toBeInTheDocument()
  })

  it("shows recipe and chapter counts when chapterCount > 0", () => {
    render(<CookbookCard cookbook={makeCookbook({ recipeCount: 12, chapterCount: 3 })} />)
    expect(screen.getByText(/12 recipes/)).toBeInTheDocument()
    expect(screen.getByText(/3 chapters/)).toBeInTheDocument()
  })

  it("shows singular 'chapter' for chapterCount of 1", () => {
    render(<CookbookCard cookbook={makeCookbook({ recipeCount: 2, chapterCount: 1 })} />)
    expect(screen.getByText(/1 chapter/)).toBeInTheDocument()
  })

  describe("isOwner prop", () => {
    it("renders User icon when isOwner={true}", () => {
      render(<CookbookCard cookbook={makeCookbook()} isOwner={true} />)
      expect(screen.getByRole("img", { name: "You own this" })).toBeInTheDocument()
    })

    it("does not render User icon when isOwner={false}", () => {
      render(<CookbookCard cookbook={makeCookbook()} isOwner={false} />)
      expect(screen.queryByRole("img", { name: "You own this" })).not.toBeInTheDocument()
    })

    it("does not render User icon when isOwner is omitted", () => {
      render(<CookbookCard cookbook={makeCookbook()} />)
      expect(screen.queryByRole("img", { name: "You own this" })).not.toBeInTheDocument()
    })
  })
})
