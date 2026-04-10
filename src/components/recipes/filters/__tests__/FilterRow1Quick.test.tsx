import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterRow1Quick } from '../FilterRow1Quick'
import {
  createDefaultFilterRow1QuickProps,
  createMockQuickFilterUpdateSearch,
  QUICK_FILTER_TOGGLE_CASES,
} from './test-helpers'

describe('FilterRow1Quick', () => {
  let mockUpdateSearch: ReturnType<typeof createMockQuickFilterUpdateSearch>

  beforeEach(() => {
    mockUpdateSearch = createMockQuickFilterUpdateSearch()
  })

  describe('visibility', () => {
    it('renders Has Image toggle always', () => {
      render(
        <FilterRow1Quick
          {...createDefaultFilterRow1QuickProps()}
          updateSearch={mockUpdateSearch}
        />
      )
      expect(screen.getByText('Has Image')).toBeInTheDocument()
    })

    it('shows My Recipes and Favorites toggles when logged in', () => {
      render(
        <FilterRow1Quick
          {...createDefaultFilterRow1QuickProps()}
          isLoggedIn={true}
          updateSearch={mockUpdateSearch}
        />
      )
      expect(screen.getByText('My Recipes')).toBeInTheDocument()
      expect(screen.getByText('Favorites')).toBeInTheDocument()
      expect(screen.getByText('Has Image')).toBeInTheDocument()
    })

    it('hides My Recipes and Favorites toggles when not logged in', () => {
      render(
        <FilterRow1Quick
          {...createDefaultFilterRow1QuickProps()}
          isLoggedIn={false}
          updateSearch={mockUpdateSearch}
        />
      )
      expect(screen.queryByText('My Recipes')).not.toBeInTheDocument()
      expect(screen.queryByText('Favorites')).not.toBeInTheDocument()
    })
  })

  describe('icon rendering', () => {
    it('renders an icon for each visible quick filter toggle when logged in', () => {
      render(
        <FilterRow1Quick
          {...createDefaultFilterRow1QuickProps()}
          isLoggedIn={true}
          updateSearch={mockUpdateSearch}
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
      buttons.forEach((button) => {
        const icon = button.querySelector('svg')
        expect(icon).toBeInTheDocument()
        expect(icon).toHaveClass('w-3.5', 'h-3.5')
      })
    })

    it('keeps auth-only icons hidden when logged out', () => {
      render(
        <FilterRow1Quick
          {...createDefaultFilterRow1QuickProps()}
          isLoggedIn={false}
          updateSearch={mockUpdateSearch}
        />
      )

      expect(screen.queryByText('My Recipes')).not.toBeInTheDocument()
      expect(screen.queryByText('Favorites')).not.toBeInTheDocument()
      expect(screen.getByText('Has Image')).toBeInTheDocument()
      const button = screen.getByRole('button')
      const icon = button.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('w-3.5', 'h-3.5')
    })
  })

  // Data-driven toggle tests
  describe.each(QUICK_FILTER_TOGGLE_CASES)(
    'toggle: %s',
    (label, updateKey) => {
      const isLoggedIn = label === 'My Recipes' || label === 'Favorites'

      it(`toggles ${label} filter on click`, async () => {
        const user = userEvent.setup()
        render(
          <FilterRow1Quick
            {...createDefaultFilterRow1QuickProps()}
            isLoggedIn={isLoggedIn}
            updateSearch={mockUpdateSearch}
          />
        )
        const button = screen.getByText(label).closest('button')!
        await user.click(button)
        expect(mockUpdateSearch).toHaveBeenCalledWith({ [updateKey]: true })
      })

      it(`deactivates ${label} when clicked while active`, async () => {
        const user = userEvent.setup()
        const activeState = {
          ...createDefaultFilterRow1QuickProps(),
          isLoggedIn,
          [updateKey]: true,
          updateSearch: mockUpdateSearch,
        }
        render(<FilterRow1Quick {...activeState} />)
        const button = screen.getByText(label).closest('button')!
        await user.click(button)
        expect(mockUpdateSearch).toHaveBeenCalledWith({ [updateKey]: undefined })
      })

      it(`displays active state with cyan styling for ${label}`, () => {
        const props = {
          ...createDefaultFilterRow1QuickProps(),
          isLoggedIn,
          updateSearch: mockUpdateSearch,
          [updateKey]: true,
        }
        render(<FilterRow1Quick {...props} />)
        const button = screen.getByText(label).closest('button')!
        expect(button).toHaveClass('bg-cyan-500/20', 'border-cyan-500', 'text-cyan-300')
      })

      it(`displays inactive state with slate styling for ${label}`, () => {
        render(
          <FilterRow1Quick
            {...createDefaultFilterRow1QuickProps()}
            isLoggedIn={isLoggedIn}
            updateSearch={mockUpdateSearch}
          />
        )
        const button = screen.getByText(label).closest('button')!
        expect(button).toHaveClass('bg-slate-800', 'border-slate-700', 'text-gray-400')
      })
    },
  )
})
