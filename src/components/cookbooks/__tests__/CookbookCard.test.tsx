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

  it("renders placeholder icon when imageUrl is null", () => {
    const { container } = render(<CookbookCard cookbook={makeCookbook({ imageUrl: null })} />)
    expect(container.querySelector("svg")).toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("shows Private badge for non-public cookbooks", () => {
    render(<CookbookCard cookbook={makeCookbook({ isPublic: false })} />)
    expect(screen.getByText("Private")).toBeInTheDocument()
  })

  it("does not show Private badge for public cookbooks", () => {
    render(<CookbookCard cookbook={makeCookbook({ isPublic: true })} />)
    expect(screen.queryByText("Private")).not.toBeInTheDocument()
  })
})
