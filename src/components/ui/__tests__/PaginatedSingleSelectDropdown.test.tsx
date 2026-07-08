import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import PaginatedSingleSelectDropdown from '../PaginatedSingleSelectDropdown'
import type { PageResult, PaginatedOption } from '../PaginatedSingleSelectDropdown'

function makeOptions(prefix: string, count: number, offset = 0): PaginatedOption[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${offset + i}`,
    name: `${prefix}-${String(offset + i).padStart(3, '0')}`,
  }))
}

describe('PaginatedSingleSelectDropdown', () => {
  it('fetches exactly one page on open and renders items in the received order', async () => {
    const page1: PageResult = { items: makeOptions('Item', 3), nextCursor: null }
    const fetchPage = vi.fn().mockResolvedValue(page1)
    const fetchSearch = vi.fn().mockResolvedValue([])

    render(
      <PaginatedSingleSelectDropdown
        value=""
        onChange={vi.fn()}
        fetchPage={fetchPage}
        fetchSearch={fetchSearch}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select an option/i }))

    await waitFor(() => {
      expect(screen.getAllByRole('option')).toHaveLength(3)
    })
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(fetchPage).toHaveBeenCalledWith(0)
    const items = screen.getAllByRole('option')
    expect(items[0]).toHaveTextContent('Item-000')
    expect(items[2]).toHaveTextContent('Item-002')
  })

  it('loads and appends the next page on scroll-to-bottom without reordering', async () => {
    const page1: PageResult = { items: makeOptions('Item', 100), nextCursor: 100 }
    const page2: PageResult = { items: makeOptions('Item', 5, 100), nextCursor: null }
    const fetchPage = vi.fn()
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2)
    const fetchSearch = vi.fn().mockResolvedValue([])

    render(
      <PaginatedSingleSelectDropdown
        value=""
        onChange={vi.fn()}
        fetchPage={fetchPage}
        fetchSearch={fetchSearch}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select an option/i }))
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(100))

    const listbox = screen.getByRole('listbox')
    Object.defineProperty(listbox, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(listbox, 'clientHeight', { value: 200, configurable: true })
    Object.defineProperty(listbox, 'scrollTop', { value: 800, configurable: true })
    fireEvent.scroll(listbox)

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(105))
    expect(fetchPage).toHaveBeenNthCalledWith(2, 100)
    const items = screen.getAllByRole('option')
    expect(items[0]).toHaveTextContent('Item-000')
    expect(items[99]).toHaveTextContent('Item-099')
    expect(items[104]).toHaveTextContent('Item-104')
  })

  it('performs a debounced server-side search that replaces the displayed list', async () => {
    vi.useFakeTimers()
    const fetchPage = vi.fn().mockResolvedValue({ items: makeOptions('Browse', 2), nextCursor: null })
    const fetchSearch = vi.fn().mockResolvedValue(makeOptions('Found', 1))

    render(
      <PaginatedSingleSelectDropdown
        value=""
        onChange={vi.fn()}
        fetchPage={fetchPage}
        fetchSearch={fetchSearch}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select an option/i }))
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'Found' } })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(fetchSearch).toHaveBeenCalledWith('Found')
    const items = screen.getAllByRole('option')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('Found-0')
    vi.useRealTimers()
  })

  it('discards a stale in-flight browsing-mode page response once a search has started', async () => {
    let resolvePage2: (value: PageResult) => void = () => {}
    const page2Promise = new Promise<PageResult>((resolve) => { resolvePage2 = resolve })
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({ items: makeOptions('Item', 100), nextCursor: 100 })
      .mockReturnValueOnce(page2Promise)
    const fetchSearch = vi.fn().mockResolvedValue(makeOptions('Found', 1))

    vi.useFakeTimers()
    render(
      <PaginatedSingleSelectDropdown
        value=""
        onChange={vi.fn()}
        fetchPage={fetchPage}
        fetchSearch={fetchSearch}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select an option/i }))
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(screen.getAllByRole('option')).toHaveLength(100)

    const listbox = screen.getByRole('listbox')
    Object.defineProperty(listbox, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(listbox, 'clientHeight', { value: 200, configurable: true })
    Object.defineProperty(listbox, 'scrollTop', { value: 800, configurable: true })
    fireEvent.scroll(listbox)
    expect(fetchPage).toHaveBeenCalledTimes(2)

    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'Found' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(screen.getAllByRole('option')).toHaveLength(1)

    await act(async () => {
      resolvePage2({ items: makeOptions('Item', 5, 100), nextCursor: null })
      await Promise.resolve()
    })

    const items = screen.getAllByRole('option')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('Found-0')
    vi.useRealTimers()
  })

  it('resumes browsing-mode pages without refetching page 1 when search is cleared', async () => {
    vi.useFakeTimers()
    const fetchPage = vi.fn().mockResolvedValue({ items: makeOptions('Browse', 2), nextCursor: null })
    const fetchSearch = vi.fn().mockResolvedValue(makeOptions('Found', 1))

    render(
      <PaginatedSingleSelectDropdown
        value=""
        onChange={vi.fn()}
        fetchPage={fetchPage}
        fetchSearch={fetchSearch}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select an option/i }))
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(fetchPage).toHaveBeenCalledTimes(1)

    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'Found' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(screen.getAllByRole('option')).toHaveLength(1)

    fireEvent.change(searchInput, { target: { value: '' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    const items = screen.getAllByRole('option')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Browse-000')
    expect(fetchPage).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('holds at most one page-fetcher call and one page of items with no scroll/search interaction', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: makeOptions('Item', 100), nextCursor: 100 })
    const fetchSearch = vi.fn().mockResolvedValue([])

    render(
      <PaginatedSingleSelectDropdown
        value=""
        onChange={vi.fn()}
        fetchPage={fetchPage}
        fetchSearch={fetchSearch}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select an option/i }))
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(100))
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it('selects an option and invokes onChange with id and name', async () => {
    const onChange = vi.fn()
    const fetchPage = vi.fn().mockResolvedValue({ items: makeOptions('Item', 2), nextCursor: null })
    const fetchSearch = vi.fn().mockResolvedValue([])

    render(
      <PaginatedSingleSelectDropdown
        value=""
        onChange={onChange}
        fetchPage={fetchPage}
        fetchSearch={fetchSearch}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /select an option/i }))
    const option = await screen.findByText('Item-000')
    await userEvent.click(option)

    expect(onChange).toHaveBeenCalledWith('Item-0', 'Item-000')
  })
})
