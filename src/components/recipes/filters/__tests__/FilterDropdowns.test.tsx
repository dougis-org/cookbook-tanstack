import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterDropdowns } from '../FilterDropdowns'

const mockClassifications = [
  { id: '1', name: 'Desserts' },
  { id: '2', name: 'Entrees' },
  { id: '3', name: 'Appetizers' },
]

const mockSources = [
  { id: 's1', name: 'AllRecipes.com' },
  { id: 's2', name: 'Food Network' },
]

const mockMeals = [
  { id: 'm1', name: 'Breakfast' },
  { id: 'm2', name: 'Dinner' },
]

const mockCourses = [
  { id: 'c1', name: 'Appetizer' },
  { id: 'c2', name: 'Main Course' },
]

const mockPreparations = [
  { id: 'p1', name: 'Baked' },
  { id: 'p2', name: 'Grilled' },
]

const defaultProps = {
  classificationIds: undefined,
  sourceIds: undefined,
  mealIds: undefined,
  courseIds: undefined,
  preparationIds: undefined,
  classifications: mockClassifications,
  sources: mockSources,
  meals: mockMeals,
  courses: mockCourses,
  preparations: mockPreparations,
}

describe('FilterDropdowns', () => {
  let mockUpdateSearch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockUpdateSearch = vi.fn()
  })

  describe('rendering', () => {
    it('renders all five filter dropdowns', () => {
      render(<FilterDropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      expect(screen.getByTestId('filter-dropdown-classification')).toBeInTheDocument()
      expect(screen.getByTestId('filter-dropdown-source')).toBeInTheDocument()
      expect(screen.getByTestId('filter-dropdown-meal')).toBeInTheDocument()
      expect(screen.getByTestId('filter-dropdown-course')).toBeInTheDocument()
      expect(screen.getByTestId('filter-dropdown-preparation')).toBeInTheDocument()
    })

    it('renders all dropdowns with correct placeholders', () => {
      render(<FilterDropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      expect(screen.getByTestId('filter-dropdown-classification')).toHaveTextContent('All Categories')
      expect(screen.getByTestId('filter-dropdown-source')).toHaveTextContent('All Sources')
      expect(screen.getByTestId('filter-dropdown-meal')).toHaveTextContent('All Meals')
      expect(screen.getByTestId('filter-dropdown-course')).toHaveTextContent('All Courses')
      expect(screen.getByTestId('filter-dropdown-preparation')).toHaveTextContent('All Preparations')
    })
  })

  describe('classification filter', () => {
    it('calls updateSearch with classificationIds when an option is selected', async () => {
      render(<FilterDropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-classification')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // Desserts
      expect(mockUpdateSearch).toHaveBeenCalledWith({ classificationIds: ['1'] })
    })

    it('calls updateSearch with multiple classificationIds', async () => {
      render(<FilterDropdowns {...defaultProps} classificationIds={['1']} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-classification')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[1]) // Entrees
      expect(mockUpdateSearch).toHaveBeenCalledWith({ classificationIds: ['1', '2'] })
    })

    it('calls updateSearch with undefined when all classifications are cleared', async () => {
      render(<FilterDropdowns {...defaultProps} classificationIds={['1']} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-classification')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // Deselect Desserts
      expect(mockUpdateSearch).toHaveBeenCalledWith({ classificationIds: undefined })
    })

    it('shows count label when multiple classifications are selected', () => {
      render(<FilterDropdowns {...defaultProps} classificationIds={['1', '3']} updateSearch={mockUpdateSearch} />)
      expect(screen.getByTestId('filter-dropdown-classification')).toHaveTextContent('2 categories')
    })
  })

  describe('source filter', () => {
    it('calls updateSearch with sourceIds when a source is selected', async () => {
      render(<FilterDropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-source')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // AllRecipes.com
      expect(mockUpdateSearch).toHaveBeenCalledWith({ sourceIds: ['s1'] })
    })

    it('calls updateSearch with undefined when all sources are cleared', async () => {
      render(<FilterDropdowns {...defaultProps} sourceIds={['s2']} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-source')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[1]) // Deselect Food Network
      expect(mockUpdateSearch).toHaveBeenCalledWith({ sourceIds: undefined })
    })
  })

  describe('meal filter', () => {
    it('calls updateSearch with mealIds when a meal is selected', async () => {
      render(<FilterDropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-meal')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // Breakfast
      expect(mockUpdateSearch).toHaveBeenCalledWith({ mealIds: ['m1'] })
    })

    it('calls updateSearch with multiple mealIds', async () => {
      render(<FilterDropdowns {...defaultProps} mealIds={['m1']} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-meal')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[1]) // Dinner
      expect(mockUpdateSearch).toHaveBeenCalledWith({ mealIds: ['m1', 'm2'] })
    })

    it('calls updateSearch with undefined when all meals are cleared', async () => {
      render(<FilterDropdowns {...defaultProps} mealIds={['m1']} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-meal')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // Deselect Breakfast
      expect(mockUpdateSearch).toHaveBeenCalledWith({ mealIds: undefined })
    })

    it('shows count label when multiple meals are selected', () => {
      render(<FilterDropdowns {...defaultProps} mealIds={['m1', 'm2']} updateSearch={mockUpdateSearch} />)
      expect(screen.getByTestId('filter-dropdown-meal')).toHaveTextContent('2 meals')
    })
  })

  describe('course filter', () => {
    it('calls updateSearch with courseIds when a course is selected', async () => {
      render(<FilterDropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-course')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // Appetizer
      expect(mockUpdateSearch).toHaveBeenCalledWith({ courseIds: ['c1'] })
    })

    it('calls updateSearch with undefined when all courses are cleared', async () => {
      render(<FilterDropdowns {...defaultProps} courseIds={['c1']} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-course')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // Deselect Appetizer
      expect(mockUpdateSearch).toHaveBeenCalledWith({ courseIds: undefined })
    })
  })

  describe('preparation filter', () => {
    it('calls updateSearch with preparationIds when a preparation is selected', async () => {
      render(<FilterDropdowns {...defaultProps} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-preparation')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // Baked
      expect(mockUpdateSearch).toHaveBeenCalledWith({ preparationIds: ['p1'] })
    })

    it('calls updateSearch with undefined when all preparations are cleared', async () => {
      render(<FilterDropdowns {...defaultProps} preparationIds={['p1']} updateSearch={mockUpdateSearch} />)
      const wrapper = screen.getByTestId('filter-dropdown-preparation')
      await userEvent.click(wrapper.querySelector('button')!)
      const checkboxes = within(wrapper).getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // Deselect Baked
      expect(mockUpdateSearch).toHaveBeenCalledWith({ preparationIds: undefined })
    })
  })

  describe('counts', () => {
    it('displays counts in meal dropdown options', async () => {
      render(
        <FilterDropdowns
          {...defaultProps}
          updateSearch={mockUpdateSearch}
          counts={{ mealCounts: { m1: 5, m2: 12 } }}
        />,
      )
      const wrapper = screen.getByTestId('filter-dropdown-meal')
      await userEvent.click(wrapper.querySelector('button')!)
      expect(screen.getByText('Breakfast')).toBeInTheDocument()
      expect(screen.getByText('(5)')).toBeInTheDocument()
    })

    it('displays counts in classification dropdown options', async () => {
      render(
        <FilterDropdowns
          {...defaultProps}
          updateSearch={mockUpdateSearch}
          counts={{ classificationCounts: { '1': 8 } }}
        />,
      )
      const wrapper = screen.getByTestId('filter-dropdown-classification')
      await userEvent.click(wrapper.querySelector('button')!)
      expect(screen.getByText('(8)')).toBeInTheDocument()
    })
  })

  describe('empty options', () => {
    it('handles empty meals gracefully', () => {
      render(<FilterDropdowns {...defaultProps} meals={[]} updateSearch={mockUpdateSearch} />)
      expect(screen.getByTestId('filter-dropdown-meal')).toHaveTextContent('All Meals')
    })

    it('handles empty courses gracefully', () => {
      render(<FilterDropdowns {...defaultProps} courses={[]} updateSearch={mockUpdateSearch} />)
      expect(screen.getByTestId('filter-dropdown-course')).toHaveTextContent('All Courses')
    })

    it('handles empty preparations gracefully', () => {
      render(<FilterDropdowns {...defaultProps} preparations={[]} updateSearch={mockUpdateSearch} />)
      expect(screen.getByTestId('filter-dropdown-preparation')).toHaveTextContent('All Preparations')
    })
  })
})
