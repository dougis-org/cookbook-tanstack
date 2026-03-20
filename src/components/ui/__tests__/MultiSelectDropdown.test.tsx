import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelectDropdown } from '../MultiSelectDropdown'

const OPTIONS = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
  { id: 'c', name: 'Gamma' },
]

describe('MultiSelectDropdown', () => {
  describe('button label', () => {
    it('shows placeholder when no items selected', () => {
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={[]} onChange={vi.fn()} placeholder="All Items" label="item" />,
      )
      expect(screen.getByRole('button')).toHaveTextContent('All Items')
    })

    it('shows option name when exactly one item is selected', () => {
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={['b']} onChange={vi.fn()} placeholder="All Items" label="item" />,
      )
      expect(screen.getByRole('button')).toHaveTextContent('Beta')
    })

    it('shows count label when two or more items are selected', () => {
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={['a', 'c']} onChange={vi.fn()} placeholder="All Items" label="item" />,
      )
      expect(screen.getByRole('button')).toHaveTextContent('2 items')
    })

    it('uses labelPlural when provided instead of appending s', () => {
      render(
        <MultiSelectDropdown
          options={OPTIONS}
          selectedIds={['a', 'c']}
          onChange={vi.fn()}
          placeholder="All"
          label="category"
          labelPlural="categories"
        />,
      )
      expect(screen.getByRole('button')).toHaveTextContent('2 categories')
    })
  })

  describe('dropdown panel', () => {
    it('panel is hidden initially', () => {
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={[]} onChange={vi.fn()} placeholder="All Items" label="item" />,
      )
      expect(screen.queryByTestId('dropdown-panel')).not.toBeInTheDocument()
    })

    it('opens the checkbox panel on button click', async () => {
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={[]} onChange={vi.fn()} placeholder="All Items" label="item" />,
      )
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByTestId('dropdown-panel')).toBeInTheDocument()
      expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    })

    it('closes the panel on second button click', async () => {
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={[]} onChange={vi.fn()} placeholder="All Items" label="item" />,
      )
      await userEvent.click(screen.getByRole('button'))
      await userEvent.click(screen.getByRole('button'))
      expect(screen.queryByTestId('dropdown-panel')).not.toBeInTheDocument()
    })

    it('closes the panel when Escape is pressed', async () => {
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={[]} onChange={vi.fn()} placeholder="All Items" label="item" />,
      )
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByTestId('dropdown-panel')).toBeInTheDocument()
      await userEvent.keyboard('{Escape}')
      expect(screen.queryByTestId('dropdown-panel')).not.toBeInTheDocument()
    })

    it('closes the panel when clicking outside the component', async () => {
      render(
        <div>
          <MultiSelectDropdown options={OPTIONS} selectedIds={[]} onChange={vi.fn()} placeholder="All Items" label="item" />
          <button data-testid="outside-button">Outside</button>
        </div>,
      )
      await userEvent.click(screen.getByRole('button', { name: /All Items/i }))
      expect(screen.getByTestId('dropdown-panel')).toBeInTheDocument()
      await userEvent.click(screen.getByTestId('outside-button'))
      expect(screen.queryByTestId('dropdown-panel')).not.toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('calls onChange with added ID when an unchecked option is checked', async () => {
      const onChange = vi.fn()
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={['a']} onChange={onChange} placeholder="All Items" label="item" />,
      )
      await userEvent.click(screen.getByRole('button'))
      const checkboxes = screen.getAllByRole('checkbox')
      // checkboxes are in order: Alpha (checked), Beta (unchecked), Gamma (unchecked)
      await userEvent.click(checkboxes[1]) // Beta
      expect(onChange).toHaveBeenCalledWith(['a', 'b'])
    })

    it('calls onChange with removed ID when a checked option is unchecked', async () => {
      const onChange = vi.fn()
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={['a', 'b']} onChange={onChange} placeholder="All Items" label="item" />,
      )
      await userEvent.click(screen.getByRole('button'))
      const checkboxes = screen.getAllByRole('checkbox')
      await userEvent.click(checkboxes[0]) // Alpha — currently checked
      expect(onChange).toHaveBeenCalledWith(['b'])
    })
  })

  describe('counts', () => {
    it('displays counts next to each option when counts prop is provided', async () => {
      render(
        <MultiSelectDropdown
          options={OPTIONS}
          selectedIds={[]}
          onChange={vi.fn()}
          placeholder="All Items"
          label="item"
          counts={{ a: 5, b: 12, c: 0 }}
        />,
      )
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('(5)')).toBeInTheDocument()
      expect(screen.getByText('(12)')).toBeInTheDocument()
      expect(screen.getByText('(0)')).toBeInTheDocument()
    })

    it('does not display counts when counts prop is absent', async () => {
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={[]} onChange={vi.fn()} placeholder="All Items" label="item" />,
      )
      await userEvent.click(screen.getByRole('button'))
      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('sets aria-expanded=false when closed', () => {
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={[]} onChange={vi.fn()} placeholder="All Items" label="item" />,
      )
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    })

    it('sets aria-expanded=true when open', async () => {
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={[]} onChange={vi.fn()} placeholder="All Items" label="item" />,
      )
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    })

    it('includes current selection state in aria-label when ariaLabel is provided', () => {
      render(
        <MultiSelectDropdown
          options={OPTIONS}
          selectedIds={['a', 'b']}
          onChange={vi.fn()}
          placeholder="All Items"
          label="item"
          ariaLabel="filter by item"
        />,
      )
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', '2 items filter by item')
    })

    it('omits aria-label when ariaLabel prop is not provided', () => {
      render(
        <MultiSelectDropdown options={OPTIONS} selectedIds={[]} onChange={vi.fn()} placeholder="All Items" label="item" />,
      )
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-label')
    })
  })
})
