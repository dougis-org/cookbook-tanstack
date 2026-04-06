import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CookbookAlphaIndex } from '@/components/cookbooks/CookbookStandaloneLayout'

// Display-ordered recipes (as returned by printById)
const recipes = [
  { id: 'r1', name: 'Zucchini Bread', prepTime: null, cookTime: null, orderIndex: 0 },
  { id: 'r2', name: 'Apple Pie', prepTime: null, cookTime: null, orderIndex: 1 },
  { id: 'r3', name: 'Banana Foster', prepTime: null, cookTime: null, orderIndex: 2 },
  { id: 'r4', name: 'Apple Crisp', prepTime: null, cookTime: null, orderIndex: 3 },
  { id: 'r5', name: '42 Spice Rub', prepTime: null, cookTime: null, orderIndex: 4 },
]

describe('CookbookAlphaIndex', () => {
  it('renders nothing when recipes array is empty', () => {
    const { container } = render(<CookbookAlphaIndex recipes={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('index container has print:break-before-page class', () => {
    const { container } = render(<CookbookAlphaIndex recipes={recipes} />)
    const root = container.firstChild as HTMLElement
    expect(root.classList.contains('print:break-before-page')).toBe(true)
  })

  it('renders all items in a single <ol>', () => {
    const { container } = render(<CookbookAlphaIndex recipes={recipes} />)
    const lists = container.querySelectorAll('ol')
    expect(lists).toHaveLength(1)
  })

  it('renders letter labels as <li> elements (not <h3>)', () => {
    render(<CookbookAlphaIndex recipes={recipes} />)
    const aItem = screen.getByText('A')
    expect(aItem.tagName).toBe('LI')
    const bItem = screen.getByText('B')
    expect(bItem.tagName).toBe('LI')
    const zItem = screen.getByText('Z')
    expect(zItem.tagName).toBe('LI')
  })

  it('places recipes starting with a digit under # bucket', () => {
    const { container } = render(<CookbookAlphaIndex recipes={recipes} />)
    expect(screen.getByText('#')).toBeInTheDocument()
    // '#' label is immediately followed by '42 Spice Rub' in the flat list
    const listItems = Array.from(container.querySelectorAll('ol > li'))
    const hashIndex = listItems.findIndex((li) => li.textContent?.trim() === '#')
    expect(hashIndex).toBeGreaterThanOrEqual(0)
    expect(listItems[hashIndex + 1]).toHaveTextContent('42 Spice Rub')
  })

  it('sorts recipes alphabetically within each group', () => {
    const { container } = render(<CookbookAlphaIndex recipes={recipes} />)
    const listItems = Array.from(container.querySelectorAll('ol > li'))
    const aIndex = listItems.findIndex((li) => li.textContent?.trim() === 'A')
    expect(aIndex).toBeGreaterThanOrEqual(0)
    // Apple Crisp comes before Apple Pie alphabetically
    expect(listItems[aIndex + 1]).toHaveTextContent('Apple Crisp')
    expect(listItems[aIndex + 2]).toHaveTextContent('Apple Pie')
  })

  it('renders #N position numbers matching buildPageMap for display-ordered input', () => {
    const { container } = render(<CookbookAlphaIndex recipes={recipes} />)
    const listItems = Array.from(container.querySelectorAll('ol > li'))
    // Display order: r1=#1, r2=#2, r3=#3, r4=#4, r5=#5
    const appleCrispItem = listItems.find((li) => li.textContent?.includes('Apple Crisp'))
    const applePieItem = listItems.find((li) => li.textContent?.includes('Apple Pie'))
    expect(appleCrispItem).toHaveTextContent('#4')
    expect(applePieItem).toHaveTextContent('#2')
  })

  it('does not render "pg N" text in any recipe row', () => {
    render(<CookbookAlphaIndex recipes={recipes} />)
    expect(screen.queryByText(/^pg \d+$/)).toBeNull()
  })

  it('recipe entries are not anchor/Link elements (plain text rows)', () => {
    const { container } = render(<CookbookAlphaIndex recipes={recipes} />)
    // No <a> tags should be rendered inside the index
    const anchors = container.querySelectorAll('a')
    expect(anchors).toHaveLength(0)
  })

  it('renders all recipe names', () => {
    render(<CookbookAlphaIndex recipes={recipes} />)
    expect(screen.getByText('Zucchini Bread')).toBeInTheDocument()
    expect(screen.getByText('Apple Pie')).toBeInTheDocument()
    expect(screen.getByText('Banana Foster')).toBeInTheDocument()
    expect(screen.getByText('Apple Crisp')).toBeInTheDocument()
    expect(screen.getByText('42 Spice Rub')).toBeInTheDocument()
  })
})
