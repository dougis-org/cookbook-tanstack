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

function renderDropdown({
  fetchPage,
  fetchSearch,
  onChange = vi.fn(),
}: {
  fetchPage: ReturnType<typeof vi.fn>
  fetchSearch: ReturnType<typeof vi.fn>
  onChange?: ReturnType<typeof vi.fn>
}) {
  return render(
    <PaginatedSingleSelectDropdown
      value=""
      onChange={onChange}
      fetchPage={fetchPage}
      fetchSearch={fetchSearch}
    />,
  )
}

function openDropdown() {
  fireEvent.click(screen.getByRole('button', { name: /select an option/i }))
}

function scrollListboxToBottom() {
  const listbox = screen.getByRole('listbox')
  Object.defineProperty(listbox, 'scrollHeight', { value: 1000, configurable: true })
  Object.defineProperty(listbox, 'clientHeight', { value: 200, configurable: true })
  Object.defineProperty(listbox, 'scrollTop', { value: 800, configurable: true })
  fireEvent.scroll(listbox)
}

async function flushTimers(ms?: number) {
  await act(async () => {
    if (ms === undefined) await vi.runAllTimersAsync()
    else await vi.advanceTimersByTimeAsync(ms)
  })
}

const SEARCH_DEBOUNCE_MS = 300

describe('PaginatedSingleSelectDropdown', () => {
  it('fetches exactly one page on open and renders items in the received order', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: makeOptions('Item', 3), nextCursor: null })
    const fetchSearch = vi.fn().mockResolvedValue([])
    renderDropdown({ fetchPage, fetchSearch })

    openDropdown()

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3))
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(fetchPage).toHaveBeenCalledWith(0)
    const items = screen.getAllByRole('option')
    expect(items[0]).toHaveTextContent('Item-000')
    expect(items[2]).toHaveTextContent('Item-002')
  })

  it('loads and appends the next page on scroll-to-bottom without reordering', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({ items: makeOptions('Item', 100), nextCursor: 100 })
      .mockResolvedValueOnce({ items: makeOptions('Item', 5, 100), nextCursor: null })
    const fetchSearch = vi.fn().mockResolvedValue([])
    renderDropdown({ fetchPage, fetchSearch })

    openDropdown()
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(100))

    scrollListboxToBottom()

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
    renderDropdown({ fetchPage, fetchSearch })

    openDropdown()
    await flushTimers()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Found' } })
    await flushTimers(SEARCH_DEBOUNCE_MS)

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
    renderDropdown({ fetchPage, fetchSearch })

    openDropdown()
    await flushTimers()
    expect(screen.getAllByRole('option')).toHaveLength(100)

    scrollListboxToBottom()
    expect(fetchPage).toHaveBeenCalledTimes(2)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Found' } })
    await flushTimers(SEARCH_DEBOUNCE_MS)
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
    renderDropdown({ fetchPage, fetchSearch })

    openDropdown()
    await flushTimers()
    expect(fetchPage).toHaveBeenCalledTimes(1)

    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'Found' } })
    await flushTimers(SEARCH_DEBOUNCE_MS)
    expect(screen.getAllByRole('option')).toHaveLength(1)

    fireEvent.change(searchInput, { target: { value: '' } })
    await flushTimers(SEARCH_DEBOUNCE_MS)

    const items = screen.getAllByRole('option')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Browse-000')
    expect(fetchPage).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('holds at most one page-fetcher call and one page of items with no scroll/search interaction', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: makeOptions('Item', 100), nextCursor: 100 })
    const fetchSearch = vi.fn().mockResolvedValue([])
    renderDropdown({ fetchPage, fetchSearch })

    openDropdown()
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(100))
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })

  it('selects an option and invokes onChange with id and name', async () => {
    const onChange = vi.fn()
    const fetchPage = vi.fn().mockResolvedValue({ items: makeOptions('Item', 2), nextCursor: null })
    const fetchSearch = vi.fn().mockResolvedValue([])
    renderDropdown({ fetchPage, fetchSearch, onChange })

    openDropdown()
    const option = await screen.findByText('Item-000')
    await userEvent.click(option)

    expect(onChange).toHaveBeenCalledWith('Item-0', 'Item-000')
  })

  it('shows a retry option when the initial page fetch fails, and recovers on retry', async () => {
    const fetchPage = vi.fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ items: makeOptions('Item', 2), nextCursor: null })
    const fetchSearch = vi.fn().mockResolvedValue([])
    renderDropdown({ fetchPage, fetchSearch })

    openDropdown()
    fireEvent.click(await screen.findByRole('button', { name: /retry/i }))

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2))
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('shows a retry option when loading the next page fails, and recovers on retry', async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({ items: makeOptions('Item', 100), nextCursor: 100 })
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ items: makeOptions('Item', 5, 100), nextCursor: null })
    const fetchSearch = vi.fn().mockResolvedValue([])
    renderDropdown({ fetchPage, fetchSearch })

    openDropdown()
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(100))

    scrollListboxToBottom()
    await screen.findByRole('button', { name: /retry/i })

    // Closing and reopening the dropdown clears the stale error state rather
    // than showing a leftover "Failed to load more" message.
    fireEvent.keyDown(document, { key: 'Escape' })
    openDropdown()
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()

    scrollListboxToBottom()

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(105))
    expect(fetchPage).toHaveBeenCalledTimes(3)
  })

  it('shows a retry option when search fails, and recovers on retry', async () => {
    vi.useFakeTimers()
    const fetchPage = vi.fn().mockResolvedValue({ items: makeOptions('Browse', 1), nextCursor: null })
    const fetchSearch = vi.fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(makeOptions('Found', 1))
    renderDropdown({ fetchPage, fetchSearch })

    openDropdown()
    await flushTimers()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Found' } })
    await flushTimers(SEARCH_DEBOUNCE_MS)

    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    await flushTimers(0)

    const items = screen.getAllByRole('option')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('Found-0')
    expect(fetchSearch).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})
