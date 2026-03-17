import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterRow2Dropdowns } from '../FilterRow2Dropdowns'
import { MOCK_COURSES, createMockUpdateSearch } from './test-helpers'

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
  classificationId: undefined,
  sourceId: undefined,
  classifications: mockClassifications,
  sources: mockSources,
}

describe('FilterRow2Dropdowns', () => {
  let mockUpdateSearch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockUpdateSearch = vi.fn()
  })

  describe('rendering', () => {
    it('renders Classification dropdown', () => {
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument()
    })

    it('renders Source dropdown', () => {
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      expect(screen.getByDisplayValue('All Sources')).toBeInTheDocument()
    })
  })

  describe('classification options', () => {
    it('displays all options', () => {
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      mockClassifications.forEach(c => {
        expect(screen.getByText(c.name)).toBeInTheDocument()
      })
    })

    it('calls updateSearch when selected', async () => {
      const user = userEvent.setup()
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      const select = screen.getByDisplayValue('All Categories')
      await user.selectOptions(select, '1')
      expect(mockUpdateSearch).toHaveBeenCalledWith({ classificationId: '1' })
    })

    it('calls updateSearch with undefined when reset', async () => {
      const user = userEvent.setup()
      render(
        <FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} classificationId="1" />
      )
      const select = screen.getByDisplayValue('Desserts')
      await user.selectOptions(select, '')
      expect(mockUpdateSearch).toHaveBeenCalledWith({ classificationId: undefined })
    })

    it('displays selected value', () => {
      render(
        <FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} classificationId="2" />
      )
      expect(screen.getByDisplayValue('Entrees')).toBeInTheDocument()
    })
  })

  describe('source options', () => {
    it('displays all options', () => {
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      mockSources.forEach(s => {
        expect(screen.getByText(s.name)).toBeInTheDocument()
      })
    })

    it('calls updateSearch when selected', async () => {
      const user = userEvent.setup()
      render(<FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      const select = screen.getByDisplayValue('All Sources')
      await user.selectOptions(select, 's1')
      expect(mockUpdateSearch).toHaveBeenCalledWith({ sourceId: 's1' })
    })

    it('calls updateSearch with undefined when reset', async () => {
      const user = userEvent.setup()
      render(
        <FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} sourceId="s1" />
      )
      const select = screen.getByDisplayValue('AllRecipes.com')
      await user.selectOptions(select, '')
      expect(mockUpdateSearch).toHaveBeenCalledWith({ sourceId: undefined })
    })

    it('displays selected value', () => {
      render(
        <FilterRow2Dropdowns {...defaultProps} updateSearch={mockUpdateSearch} sourceId="s2" />
      )
      expect(screen.getByDisplayValue('Food Network')).toBeInTheDocument()
    })
  })

  it('handles empty classifications gracefully', () => {
    render(
      <FilterRow2Dropdowns
        {...defaultProps}
        classifications={[]}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument()
  })

  it('handles empty sources gracefully', () => {
    render(
      <FilterRow2Dropdowns
        {...defaultProps}
        sources={[]}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByDisplayValue('All Sources')).toBeInTheDocument()
  })
})
