import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterMoreFiltersPanel } from '../FilterMoreFiltersPanel'

const mockMeals = [
  { id: 'm1', name: 'Breakfast' },
  { id: 'm2', name: 'Lunch' },
]

const mockCourses = [
  { id: 'c1', name: 'Appetizer' },
  { id: 'c2', name: 'Main' },
]

const mockPreparations = [
  { id: 'p1', name: 'Baked' },
  { id: 'p2', name: 'Fried' },
]

describe('FilterMoreFiltersPanel', () => {
  const mockUpdateSearch = vi.fn()

  beforeEach(() => {
    mockUpdateSearch.mockClear()
  })

  it('renders toggle button', () => {
    render(
      <FilterMoreFiltersPanel
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByText('More Filters')).toBeInTheDocument()
  })

  it('expands panel when toggle is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
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
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')

    // Expand
    await user.click(toggleButton)
    expect(screen.getByTestId('filter-more-filters-content')).toBeInTheDocument()

    // Collapse
    await user.click(toggleButton)
    expect(screen.queryByTestId('filter-more-filters-content')).not.toBeInTheDocument()
  })

  it('renders taxonomy chips when panel is expanded', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    expect(screen.getByText('Meals')).toBeInTheDocument()
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Preparations')).toBeInTheDocument()
  })

  it('calls updateSearch when meal chip is selected', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    const mealButton = screen.getByText('Breakfast').closest('button')!
    await user.click(mealButton)
    expect(mockUpdateSearch).toHaveBeenCalledWith({ mealIds: ['m1'] })
  })

  it('calls updateSearch when course chip is selected', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    const courseButton = screen.getByText('Appetizer').closest('button')!
    await user.click(courseButton)
    expect(mockUpdateSearch).toHaveBeenCalledWith({ courseIds: ['c1'] })
  })

  it('calls updateSearch when preparation chip is selected', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    const prepButton = screen.getByText('Baked').closest('button')!
    await user.click(prepButton)
    expect(mockUpdateSearch).toHaveBeenCalledWith({ preparationIds: ['p1'] })
  })

  it('deselects taxonomy chip when clicked while active', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        mealIds={['m1']}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    const mealButton = screen.getByText('Breakfast').closest('button')!
    await user.click(mealButton)
    expect(mockUpdateSearch).toHaveBeenCalledWith({ mealIds: undefined })
  })

  it('renders min/max servings inputs when panel is expanded', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
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
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    const minInput = screen.getByTestId('filter-min-servings')
    await user.type(minInput, '4')
    expect(mockUpdateSearch).toHaveBeenCalledWith({ minServings: 4 })
  })

  it('updates maxServings when number is entered', async () => {
    const user = userEvent.setup()
    render(
      <FilterMoreFiltersPanel
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    const maxInput = screen.getByTestId('filter-max-servings')
    await user.type(maxInput, '8')
    expect(mockUpdateSearch).toHaveBeenCalledWith({ maxServings: 8 })
  })

  it('preserves panel expand state when filters change', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <FilterMoreFiltersPanel
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )
    const toggleButton = screen.getByTestId('filter-more-filters-toggle')
    await user.click(toggleButton)

    // Re-render with changed filters
    rerender(
      <FilterMoreFiltersPanel
        mealIds={['m1']}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )

    // Panel should still be expanded
    expect(screen.getByTestId('filter-more-filters-content')).toBeInTheDocument()
  })

  it('displays Active indicator when filters are set', async () => {
    render(
      <FilterMoreFiltersPanel
        mealIds={['m1']}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
        updateSearch={mockUpdateSearch}
      />
    )
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('does not display Active indicator when no filters are set', () => {
    render(
      <FilterMoreFiltersPanel
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
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
        mealIds={undefined}
        courseIds={undefined}
        preparationIds={undefined}
        minServings={undefined}
        maxServings={undefined}
        allMeals={mockMeals}
        allCourses={mockCourses}
        allPreparations={mockPreparations}
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
