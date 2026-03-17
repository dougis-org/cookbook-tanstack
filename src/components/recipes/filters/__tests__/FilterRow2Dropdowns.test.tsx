import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

describe('FilterRow2Dropdowns', () => {
  const mockUpdateSearch = vi.fn()

  beforeEach(() => {
    mockUpdateSearch.mockClear()
  })

  it('renders Classification dropdown by default', () => {
    render(
      <FilterRow2Dropdowns
        classificationId={undefined}
        sourceId={undefined}
        classifications={mockClassifications}
        sources={mockSources}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument()
  })

  it('renders Source dropdown by default', () => {
    render(
      <FilterRow2Dropdowns
        classificationId={undefined}
        sourceId={undefined}
        classifications={mockClassifications}
        sources={mockSources}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByDisplayValue('All Sources')).toBeInTheDocument()
  })

  it('displays all classification options', () => {
    render(
      <FilterRow2Dropdowns
        classificationId={undefined}
        sourceId={undefined}
        classifications={mockClassifications}
        sources={mockSources}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByText('Desserts')).toBeInTheDocument()
    expect(screen.getByText('Entrees')).toBeInTheDocument()
    expect(screen.getByText('Appetizers')).toBeInTheDocument()
  })

  it('displays all source options', () => {
    render(
      <FilterRow2Dropdowns
        classificationId={undefined}
        sourceId={undefined}
        classifications={mockClassifications}
        sources={mockSources}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByText('AllRecipes.com')).toBeInTheDocument()
    expect(screen.getByText('Food Network')).toBeInTheDocument()
  })

  it('calls updateSearch when Classification is selected', async () => {
    const user = userEvent.setup()
    render(
      <FilterRow2Dropdowns
        classificationId={undefined}
        sourceId={undefined}
        classifications={mockClassifications}
        sources={mockSources}
        updateSearch={mockUpdateSearch}
      />
    )
    const classificationSelect = screen.getByDisplayValue('All Categories')
    await user.selectOptions(classificationSelect, '1')
    expect(mockUpdateSearch).toHaveBeenCalledWith({ classificationId: '1' })
  })

  it('calls updateSearch with undefined when Classification is reset', async () => {
    const user = userEvent.setup()
    render(
      <FilterRow2Dropdowns
        classificationId="1"
        sourceId={undefined}
        classifications={mockClassifications}
        sources={mockSources}
        updateSearch={mockUpdateSearch}
      />
    )
    const classificationSelect = screen.getByDisplayValue('Desserts')
    await user.selectOptions(classificationSelect, '')
    expect(mockUpdateSearch).toHaveBeenCalledWith({ classificationId: undefined })
  })

  it('calls updateSearch when Source is selected', async () => {
    const user = userEvent.setup()
    render(
      <FilterRow2Dropdowns
        classificationId={undefined}
        sourceId={undefined}
        classifications={mockClassifications}
        sources={mockSources}
        updateSearch={mockUpdateSearch}
      />
    )
    const sourceSelect = screen.getByDisplayValue('All Sources')
    await user.selectOptions(sourceSelect, 's1')
    expect(mockUpdateSearch).toHaveBeenCalledWith({ sourceId: 's1' })
  })

  it('displays selected Classification', () => {
    render(
      <FilterRow2Dropdowns
        classificationId="2"
        sourceId={undefined}
        classifications={mockClassifications}
        sources={mockSources}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByDisplayValue('Entrees')).toBeInTheDocument()
  })

  it('displays selected Source', () => {
    render(
      <FilterRow2Dropdowns
        classificationId={undefined}
        sourceId="s2"
        classifications={mockClassifications}
        sources={mockSources}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByDisplayValue('Food Network')).toBeInTheDocument()
  })

  it('displays counts when provided', () => {
    render(
      <FilterRow2Dropdowns
        classificationId={undefined}
        sourceId={undefined}
        classifications={mockClassifications}
        sources={mockSources}
        updateSearch={mockUpdateSearch}
        counts={{
          classificationCounts: { '1': 12, '2': 8 },
          sourceCounts: { s1: 5, s2: 3 },
        }}
      />
    )
    expect(screen.getByText('Desserts (12)')).toBeInTheDocument()
    expect(screen.getByText('Entrees (8)')).toBeInTheDocument()
    expect(screen.getByText('AllRecipes.com (5)')).toBeInTheDocument()
    expect(screen.getByText('Food Network (3)')).toBeInTheDocument()
  })

  it('respects filterConfig to show/hide dropdowns', () => {
    const filterConfig = { quickFilters: [], row2Filters: ['classificationId'], allFilters: [] }
    render(
      <FilterRow2Dropdowns
        classificationId={undefined}
        sourceId={undefined}
        classifications={mockClassifications}
        sources={mockSources}
        updateSearch={mockUpdateSearch}
        filterConfig={filterConfig}
      />
    )
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('All Sources')).not.toBeInTheDocument()
  })

  it('handles undefined classifications and sources gracefully', () => {
    render(
      <FilterRow2Dropdowns
        classificationId={undefined}
        sourceId={undefined}
        classifications={undefined}
        sources={undefined}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All Sources')).toBeInTheDocument()
  })
})
