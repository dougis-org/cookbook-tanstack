import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CookbookAlphaIndex } from '@/components/cookbooks/CookbookStandaloneLayout'

// Display-ordered recipes (as returned by printById)
const recipes = [
  { id: 'r1', name: 'Zucchini Bread' },
  { id: 'r2', name: 'Apple Pie' },
  { id: 'r3', name: 'Banana Foster' },
  { id: 'r4', name: 'Apple Crisp' },
  { id: 'r5', name: '42 Spice Rub' },
]

describe('CookbookAlphaIndex', () => {
  it('renders nothing when recipes array is empty', () => {
    const { container } = render(<CookbookAlphaIndex recipes={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('groups recipes under correct letter headers', () => {
    render(<CookbookAlphaIndex recipes={recipes} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('Z')).toBeInTheDocument()
  })

  it('places recipes starting with a digit under # bucket', () => {
    render(<CookbookAlphaIndex recipes={recipes} />)
    expect(screen.getByText('#')).toBeInTheDocument()
    const hashHeading = screen.getByText('#')
    expect(hashHeading.closest('div')).toContainElement(screen.getByText('42 Spice Rub'))
  })

  it('sorts recipes alphabetically within each group', () => {
    render(<CookbookAlphaIndex recipes={recipes} />)
    // Both Apple Crisp and Apple Pie are under A; Crisp < Pie alphabetically
    const aSection = screen.getByText('A').closest('div')!
    const items = aSection.querySelectorAll('li')
    expect(items[0]).toHaveTextContent('Apple Crisp')
    expect(items[1]).toHaveTextContent('Apple Pie')
  })

  it('renders page numbers matching buildPageMap for display-ordered input', () => {
    render(<CookbookAlphaIndex recipes={recipes} />)
    // Display order: r1=pg1, r2=pg2, r3=pg3, r4=pg4, r5=pg5
    // Apple Crisp is r4 → pg 4, Apple Pie is r2 → pg 2
    const aSection = screen.getByText('A').closest('div')!
    expect(aSection).toHaveTextContent('pg 4') // Apple Crisp
    expect(aSection).toHaveTextContent('pg 2') // Apple Pie
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
