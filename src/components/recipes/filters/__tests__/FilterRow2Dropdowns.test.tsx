import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterRow2Dropdowns } from '../FilterRow2Dropdowns'

const mockClassifications = [
  { id: '1', name: 'Desserts' },
  { id: '2', name: 'Entrees' },
  { id: '3', name: 'Appetizers' },
]

const mockSources = [
  { id: 's1', name: 'AllRecipes.com' },
  { id: 's2', name: 'Food Network' },
]

const defaultProps = {
  classificationIds: undefined,
  sourceIds: undefined,
  classifications: mockClassifications,
  sources: mockSources,
}

describe('FilterRow2Dropdowns', () => {
  let mockUpdateSearch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockUpdateSearch = vi.fn()
  })

  describe('rendering', () => {
    it('renders Classification dropdown button with placeholder', () => {
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      expect(screen.getByTestId('filter-dropdown-classification')).toBeInTheDocument()
      expect(screen.getByTestId('filter-dropdown-classification')).toHaveTextContent('All Categories')
    })

    it('renders Source dropdown button with placeholder', () => {
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      expect(screen.getByTestId('filter-dropdown-source')).toBeInTheDocument()
      expect(screen.getByTestId('filter-dropdown-source')).toHaveTextContent('All Sources')
    })
  })

  describe('classification options', () => {
    it('displays all options when dropdown is open', async () => {
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      await userEvent.click(screen.getByTestId('filter-dropdown-classification').querySelector('button')!)
      mockClassifications.forEach((c) => {
        expect(screen.getByText(c.name)).toBeInTheDocument()
      })
    })

    it('calls updateSearch with array when an option is selected', async () => {
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-classification')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // Desserts
      expect(mockUpdateSearch).toHaveBeenCalledWith({ classificationIds: ['1'] })
    })

    it('calls updateSearch with multiple IDs when two options are selected', async () => {
      render(
        <FilterRow2Dropdowns
          {...defaultProps}
          classificationIds={['1']}
          updateSearch={mockUpdateSearch}
        />,
      )
      const wrapper = screen.getByTestId('filter-dropdown-classification')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[1]) // Entrees
      expect(mockUpdateSearch).toHaveBeenCalledWith({ classificationIds: ['1', '2'] })
    })

    it('calls updateSearch with undefined when all selections are cleared', async () => {
      render(
        <FilterRow2Dropdowns
          {...defaultProps}
          classificationIds={['1']}
          updateSearch={mockUpdateSearch}
        />,
      )
      const wrapper = screen.getByTestId('filter-dropdown-classification')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // Deselect Desserts (the only selected one)
      expect(mockUpdateSearch).toHaveBeenCalledWith({ classificationIds: undefined })
    })

    it('shows selected count in button label when one item is selected', () => {
      render(
        <FilterRow2Dropdowns
          {...defaultProps}
          classificationIds={['2']}
          updateSearch={mockUpdateSearch}
        />,
      )
      expect(screen.getByTestId('filter-dropdown-classification')).toHaveTextContent('Entrees')
    })

    it('shows count label in button when multiple items are selected', () => {
      render(
        <FilterRow2Dropdowns
          {...defaultProps}
          classificationIds={['1', '3']}
          updateSearch={mockUpdateSearch}
        />,
      )
      expect(screen.getByTestId('filter-dropdown-classification')).toHaveTextContent('2 classifications')
    })
  })

  describe('source options', () => {
    it('displays all options when dropdown is open', async () => {
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      await userEvent.click(screen.getByTestId('filter-dropdown-source').querySelector('button')!)
      mockSources.forEach((s) => {
        expect(screen.getByText(s.name)).toBeInTheDocument()
      })
    })

    it('calls updateSearch with array when a source is selected', async () => {
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-source')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // AllRecipes.com
      expect(mockUpdateSearch).toHaveBeenCalledWith({ sourceIds: ['s1'] })
    })

    it('calls updateSearch with undefined when all source selections are cleared', async () => {
      render(
        <FilterRow2Dropdowns
          {...defaultProps}
          sourceIds={['s2']}
          updateSearch={mockUpdateSearch}
        />,
      )
      const wrapper = screen.getByTestId('filter-dropdown-source')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[1]) // Food Network (selected)
      expect(mockUpdateSearch).toHaveBeenCalledWith({ sourceIds: undefined })
    })
  })

  it('handles empty classifications gracefully', () => {
    render(
      <FilterRow2Dropdowns
        {...defaultProps}
        classifications={[]}
        updateSearch={mockUpdateSearch}
      />,
    )
    expect(screen.getByTestId('filter-dropdown-classification')).toHaveTextContent('All Categories')
  })

  it('handles empty sources gracefully', () => {
    render(
      <FilterRow2Dropdowns
        {...defaultProps}
        sources={[]}
        updateSearch={mockUpdateSearch}
      />,
    )
    expect(screen.getByTestId('filter-dropdown-source')).toHaveTextContent('All Sources')
  })
})
