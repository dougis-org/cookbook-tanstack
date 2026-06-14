import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SingleSelectDropdown from '../SingleSelectDropdown'
import userEvent from '@testing-library/user-event'

describe('SingleSelectDropdown', () => {
  const options = [
    { id: '1', name: 'Dinner' },
    { id: '2', name: 'Breakfast' },
    { id: '3', name: 'Snack' }
  ]

  it('renders options in alphabetical order', async () => {
    render(<SingleSelectDropdown options={options} value="" onChange={vi.fn()} />)
    
    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /Select/i }))
    
    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Breakfast')
    expect(items[1]).toHaveTextContent('Dinner')
    expect(items[2]).toHaveTextContent('Snack')
  })

  it('pins the selected option to the top of the list', async () => {
    render(<SingleSelectDropdown options={options} value="3" selectedName="Snack" onChange={vi.fn()} />)
    
    fireEvent.click(screen.getByRole('button', { name: 'Snack' }))
    
    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Snack')
    expect(items[1]).toHaveTextContent('Breakfast')
    expect(items[2]).toHaveTextContent('Dinner')
  })

  it('filters options when typing in the search input', async () => {
    render(<SingleSelectDropdown options={options} value="" onChange={vi.fn()} />)
    
    fireEvent.click(screen.getByRole('button', { name: /Select/i }))
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'ak')
    
    // Wait for the debounce search logic
    await waitFor(async () => {
      const items = await screen.findAllByRole('listitem')
      expect(items).toHaveLength(2)
      expect(items[0]).toHaveTextContent('Breakfast')
      expect(items[1]).toHaveTextContent('Snack')
    })
  })

  it('displays a "No items found" message when no options match', async () => {
    render(<SingleSelectDropdown options={options} value="" onChange={vi.fn()} />)
    
    fireEvent.click(screen.getByRole('button', { name: /Select/i }))
    
    const searchInput = screen.getByRole('searchbox')
    await userEvent.type(searchInput, 'xyz')
    
    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument()
    })
  })

  it('closes on Escape key', async () => {
    render(<SingleSelectDropdown options={options} value="" onChange={vi.fn()} />)
    
    const button = screen.getByRole('button', { name: /Select/i })
    fireEvent.click(button)
    
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    
    await waitFor(() => {
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    })
  })
})
