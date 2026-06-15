import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ComponentProps } from 'react'
import SingleSelectDropdown from '../SingleSelectDropdown'
import userEvent from '@testing-library/user-event'

describe('SingleSelectDropdown', () => {
  const options = [
    { id: '1', name: 'Dinner' },
    { id: '2', name: 'Breakfast' },
    { id: '3', name: 'Snack' }
  ]

  const setup = (props: Partial<ComponentProps<typeof SingleSelectDropdown>> = {}, open = true) => {
    const utils = render(<SingleSelectDropdown options={options} value="" onChange={vi.fn()} {...props} />)
    const expectedName = props.selectedName || (props.value ? (options.find(o => o.id === props.value)?.name) : '') || /Select/i
    const trigger = screen.getByRole('button', { name: expectedName })
    if (open) {
      fireEvent.click(trigger)
    }
    return { ...utils, trigger }
  }

  it('renders options in alphabetical order', async () => {
    setup()
    
    const items = await screen.findAllByRole('option')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Breakfast')
    expect(items[1]).toHaveTextContent('Dinner')
    expect(items[2]).toHaveTextContent('Snack')
  })

  it('pins the selected option to the top of the list', async () => {
    setup({ value: '3', selectedName: 'Snack' })
    
    const items = await screen.findAllByRole('option')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Snack')
    expect(items[1]).toHaveTextContent('Breakfast')
    expect(items[2]).toHaveTextContent('Dinner')
  })

  it('filters options when typing in the search input', async () => {
    setup()
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'a')
    
    // Wait for the debounce search logic
    await waitFor(() => {
      const items = screen.getAllByRole('option')
      expect(items).toHaveLength(2)
      expect(items[0]).toHaveTextContent('Breakfast')
      expect(items[1]).toHaveTextContent('Snack')
    })
  })

  it('displays a "No items found" message when no options match', async () => {
    setup()
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'xyz')
    
    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument()
    })
  })

  it('closes on Escape key', async () => {
    setup()
    
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    
    await waitFor(() => {
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })
  })

  it('closes when clicking outside the dropdown', async () => {
    setup()
    
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    
    // Simulate a mousedown event outside the component
    fireEvent.mouseDown(document.body)
    
    await waitFor(() => {
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })
  })

  it('derives selectedName from options if not provided in props', () => {
    setup({ value: '2' }, false)
    expect(screen.getByRole('button', { name: 'Breakfast' })).toBeInTheDocument()
  })

  it('resets search query when closed', async () => {
    const { trigger } = setup()
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'xyz')
    expect(searchInput).toHaveValue('xyz')
    
    // Close it
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })
    
    // Open it again and check search is empty
    fireEvent.click(trigger)
    const newSearchInput = screen.getByRole('searchbox')
    expect(newSearchInput).toHaveValue('')
  })
})
