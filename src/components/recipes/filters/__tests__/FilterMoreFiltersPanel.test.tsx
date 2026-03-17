import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterMoreFiltersPanel } from '../FilterMoreFiltersPanel'
import { createDefaultFilterMoreFiltersPanelProps, MOCK_MEALS, MOCK_COURSES, MOCK_PREPARATIONS, TAXONOMY_TOGGLE_CASES } from './test-helpers'

describe('FilterMoreFiltersPanel', () => {
  let mockUpdateSearch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockUpdateSearch = vi.fn()
  })

  it('renders toggle button', () => {
    render(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByText('More Filters')).toBeInTheDocument()
  })

  it('expands panel when toggle is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)
    expect(screen.getByTestId('filter-more-filters-content')).toBeInTheDocument()
  })

  it('collapses panel when toggle is clicked while expanded', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)
    expect(screen.getByTestId('filter-more-filters-content')).toBeInTheDocument()

    await user.click(toggleButton)
    expect(screen.queryByTestId('filter-more-filters-content')).not.toBeInTheDocument()
  })

  it('renders taxonomy chips when panel is expanded', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    expect(screen.getByText('Meals')).toBeInTheDocument()
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Preparations')).toBeInTheDocument()
  })

  // Data-driven tests for taxonomy chip selection
  describe.each(TAXONOMY_TOGGLE_CASES)(
    'taxonomy chip selection: %s → %s',
    (taxonomyType, itemId, itemName, updateKey) => {
      it(`calls updateSearch when ${itemName} chip is selected`, async () => {
        const user = userEvent.setup()
        render(
          <FilterMoreFiltersPanel
            {...createDefaultFilterMoreFiltersPanelProps()}
            updateSearch={mockUpdateSearch}
          />
        )
        const toggleButton = screen.getByTestId('filter-more-filters-toggle')
        await user.click(toggleButton)

        const button = screen.getByText(itemName).closest('button')!
        await user.click(button)

        const expectedCall = { [updateKey]: [itemId] }
        expect(mockUpdateSearch).toHaveBeenCalledWith(expectedCall)
      })

      it(`deselects ${itemName} chip when clicked while active`, async () => {
        const user = userEvent.setup()
        const propsWithActive = {
          ...createDefaultFilterMoreFiltersPanelProps(),
          updateSearch: mockUpdateSearch,
          ...(taxonomyType === 'meals' && { mealIds: [itemId] }),
          ...(taxonomyType === 'courses' && { courseIds: [itemId] }),
          ...(taxonomyType === 'preparations' && { preparationIds: [itemId] }),
        }

        render(<FilterMoreFiltersPanel {...propsWithActive} />)
        const toggleButton = screen.getByTestId('filter-more-filters-toggle')
        await user.click(toggleButton)

        const button = screen.getByText(itemName).closest('button')!
        await user.click(button)

        const expectedCall = { [updateKey]: undefined }
        expect(mockUpdateSearch).toHaveBeenCalledWith(expectedCall)
      })
    },
  )

  it('renders min/max servings inputs when panel is expanded', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    expect(screen.getByTestId('filter-min-servings')).toBeInTheDocument()
    expect(screen.getByTestId('filter-max-servings')).toBeInTheDocument()
  })

  it('updates minServings when number is entered', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    const minInput = screen.getByTestId('filter-min-servings') as HTMLInputElement
    await user.type(minInput, '4')
    expect(mockUpdateSearch).toHaveBeenCalledWith({ minServings: 4 })
  })

  it('updates maxServings when number is entered', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    const maxInput = screen.getByTestId('filter-max-servings') as HTMLInputElement
    await user.type(maxInput, '8')
    expect(mockUpdateSearch).toHaveBeenCalledWith({ maxServings: 8 })
  })

  it('preserves panel expand state when filters change', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    rerender(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
        mealIds={['m1']}
      />
    )

    expect(screen.getByTestId('filter-more-filters-content')).toBeInTheDocument()
  })

  it('displays Active indicator when filters are set', () => {
    render(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
        mealIds={['m1']}
      />
    )
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('does not display Active indicator when no filters are set', () => {
    render(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })

  it('respects filterConfig for which filters to display', async () => {
    const user = userEvent.setup()
    const filterConfig = { quickFilters: [], row2Filters: [], allFilters: ['mealIds'] }
    render(
      <FilterMoreFiltersPanel
        {...createDefaultFilterMoreFiltersPanelProps()}
        updateSearch={mockUpdateSearch}
        filterConfig={filterConfig}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    expect(screen.getByText('Meals')).toBeInTheDocument()
    expect(screen.queryByText('Courses')).not.toBeInTheDocument()
    expect(screen.queryByText('Preparations')).not.toBeInTheDocument()
  })
})
