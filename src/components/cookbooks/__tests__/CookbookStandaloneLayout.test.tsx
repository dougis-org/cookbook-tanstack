import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CookbookStandalonePage, CookbookTocList, CookbookPageChrome } from "@/components/cookbooks/CookbookStandaloneLayout"

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params }: { children: React.ReactNode; to: string; params?: Record<string, string> }) => {
    const href = params ? to.replace(/\$(\w+)/g, (_, k) => params[k] ?? '') : to
    return <a href={href}>{children}</a>
  },
}))

describe("CookbookStandalonePage", () => {
  it("renders children inside the container", () => {
    render(<CookbookStandalonePage><p>Test content</p></CookbookStandalonePage>)
    expect(screen.getByText("Test content")).toBeInTheDocument()
  })

  it("applies max-w-2xl by default", () => {
    const { container } = render(<CookbookStandalonePage><span /></CookbookStandalonePage>)
    const inner = container.querySelector(".max-w-2xl")
    expect(inner).toBeInTheDocument()
    expect(inner).toHaveClass("print:max-w-4xl")
  })

  it("applies max-w-4xl when maxWidth is 4xl", () => {
    const { container } = render(<CookbookStandalonePage maxWidth="4xl"><span /></CookbookStandalonePage>)
    expect(container.querySelector(".max-w-4xl")).toBeInTheDocument()
  })
})

// ─── CookbookTocList ──────────────────────────────────────────────────────────

const flatRecipes = [
  { id: 'r1', name: 'Soup', prepTime: 10, cookTime: 20, orderIndex: 0 },
  { id: 'r2', name: 'Salad', prepTime: 5, cookTime: null, orderIndex: 1 },
  { id: 'r3', name: 'Pasta', prepTime: null, cookTime: 30, orderIndex: 2 },
]

const chaptersData = [
  { id: 'ch1', name: 'Starters', orderIndex: 0 },
  { id: 'ch2', name: 'Mains', orderIndex: 1 },
]

const chapteredRecipes = [
  { id: 'r1', name: 'Soup', prepTime: 10, cookTime: 20, chapterId: 'ch1', orderIndex: 0 },
  { id: 'r2', name: 'Salad', prepTime: 5, cookTime: null, chapterId: 'ch1', orderIndex: 1 },
  { id: 'r3', name: 'Pasta', prepTime: null, cookTime: 30, chapterId: 'ch2', orderIndex: 0 },
]

describe('CookbookTocList', () => {
  // 2.1
  it('flat TOC renders all recipe names and sequential 1-based position numbers', () => {
    render(<CookbookTocList recipes={flatRecipes} chapters={[]} />)
    expect(screen.getByText('Soup')).toBeInTheDocument()
    expect(screen.getByText('Salad')).toBeInTheDocument()
    expect(screen.getByText('Pasta')).toBeInTheDocument()
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(screen.getByText('3.')).toBeInTheDocument()
  })

  // 2.2
  it('flat TOC <ol> carries print:columns-2 and print:gap-8 classes', () => {
    const { container } = render(<CookbookTocList recipes={flatRecipes} chapters={[]} />)
    const ol = container.querySelector('ol')
    expect(ol).toHaveClass('print:columns-2')
    expect(ol).toHaveClass('print:gap-8')
  })

  // 2.3
  it('each <li> in the flat TOC carries print:break-inside-avoid', () => {
    const { container } = render(<CookbookTocList recipes={flatRecipes} chapters={[]} />)
    const items = container.querySelectorAll('li')
    expect(items.length).toBeGreaterThan(0)
    items.forEach((li) => expect(li).toHaveClass('print:break-inside-avoid'))
  })

  // 2.4
  it('each recipe entry renders as a <Link> to /recipes/$recipeId', () => {
    const { container } = render(<CookbookTocList recipes={flatRecipes} chapters={[]} />)
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAttribute('href', '/recipes/r1')
    expect(links[1]).toHaveAttribute('href', '/recipes/r2')
    expect(links[2]).toHaveAttribute('href', '/recipes/r3')
  })

  // 2.5
  it('chapter-grouped TOC renders chapter headings and groups recipes under the correct chapter', () => {
    render(<CookbookTocList recipes={chapteredRecipes} chapters={chaptersData} />)
    expect(screen.getByText('Starters')).toBeInTheDocument()
    expect(screen.getByText('Mains')).toBeInTheDocument()
    const startersHeading = screen.getByText('Starters')
    const mainHeading = screen.getByText('Mains')
    // Starters chapter contains Soup and Salad
    expect(startersHeading.closest('div')).toContainElement(screen.getByText('Soup'))
    expect(startersHeading.closest('div')).toContainElement(screen.getByText('Salad'))
    // Mains chapter contains Pasta
    expect(mainHeading.closest('div')).toContainElement(screen.getByText('Pasta'))
  })

  // 2.6
  it('chapter-grouped TOC uses a single global counter (recipe 3 in chapter 2 is "3.")', () => {
    render(<CookbookTocList recipes={chapteredRecipes} chapters={chaptersData} />)
    const mainHeading = screen.getByText('Mains')
    const mainsSection = mainHeading.closest('div')
    expect(mainsSection).not.toBeNull()
    // Pasta is the 3rd recipe globally, so it must show "3." not "1."
    expect(mainsSection!).toContainElement(screen.getByText('3.'))
    // "1." and "2." belong to Starters
    const startersSection = screen.getByText('Starters').closest('div')
    expect(startersSection).not.toBeNull()
    expect(startersSection!).toContainElement(screen.getByText('1.'))
    expect(startersSection!).toContainElement(screen.getByText('2.'))
  })

  // 2.7
  it('each chapter <ol> carries print:columns-2 and print:gap-8 classes', () => {
    const { container } = render(<CookbookTocList recipes={chapteredRecipes} chapters={chaptersData} />)
    const ols = container.querySelectorAll('ol')
    expect(ols.length).toBeGreaterThan(0)
    ols.forEach((ol) => {
      expect(ol).toHaveClass('print:columns-2')
      expect(ol).toHaveClass('print:gap-8')
    })
  })

  // 2.8
  it('chapter heading carries the print:break-after-avoid class', () => {
    render(<CookbookTocList recipes={chapteredRecipes} chapters={chaptersData} />)
    const startersHeading = screen.getByText('Starters')
    expect(startersHeading).toHaveClass('print:break-after-avoid')
  })
})

// ─── CookbookPageChrome ───────────────────────────────────────────────────────

describe('CookbookPageChrome', () => {
  beforeEach(() => {
    vi.spyOn(window, 'print').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a print button that calls window.print() on click', async () => {
    render(
      <CookbookPageChrome
        cookbookId="cb1"
        cookbookName="My Cookbook"
        breadcrumbLabel="Table of Contents"
      />,
    )
    const printButton = screen.getByRole('button', { name: /print/i })
    expect(printButton).toBeInTheDocument()
    await userEvent.click(printButton)
    expect(window.print).toHaveBeenCalledOnce()
  })
})
