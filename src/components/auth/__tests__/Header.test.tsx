import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"

const mockNavigate = vi.fn()
let mockLocationSearch: Record<string, unknown> = {}

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { search: mockLocationSearch } }),
}))

const mockUseAuth = vi.fn()
const mockSignOut = vi.fn()

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock("@/lib/auth-client", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

const mockSetTheme = vi.fn()
let mockTheme = 'dark'

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme }),
  THEMES: [
    { id: 'dark', label: 'Dark' },
    { id: 'light-cool', label: 'Light (cool)' },
  ],
}))

import Header from "../../Header"

const defaultAuth = { session: null, isPending: false, isLoggedIn: false, userId: null }
const authedUser = {
  session: { user: { id: "123", name: "Test User", email: "test@example.com" } },
  isPending: false,
  isLoggedIn: true,
  userId: "123",
}

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocationSearch = {}
    mockTheme = 'dark'
  })

  // ─── Auth display ──────────────────────────────────────────────────────────

  it("shows login and register links when not authenticated", () => {
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)
    expect(screen.getByText("Login")).toBeInTheDocument()
    expect(screen.getByText("Register")).toBeInTheDocument()
  })

  it("shows user name and logout when authenticated", () => {
    mockUseAuth.mockReturnValue(authedUser)
    render(<Header />)
    expect(screen.getByText("Test User")).toBeInTheDocument()
    expect(screen.getByText("Logout")).toBeInTheDocument()
    expect(screen.queryByText("Login")).not.toBeInTheDocument()
    expect(screen.queryByText("Register")).not.toBeInTheDocument()
  })

  it("shows nothing while session is loading", () => {
    mockUseAuth.mockReturnValue({ session: null, isPending: true, isLoggedIn: false, userId: null })
    render(<Header />)
    expect(screen.queryByText("Login")).not.toBeInTheDocument()
    expect(screen.queryByText("Logout")).not.toBeInTheDocument()
  })

  it("navigates to /auth/login after sign-out", async () => {
    mockSignOut.mockResolvedValue(undefined)
    mockUseAuth.mockReturnValue(authedUser)
    render(<Header />)
    fireEvent.click(screen.getByText("Logout"))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/auth/login" })
    })
  })

  it("does not navigate when sign-out fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockSignOut.mockRejectedValue(new Error("network error"))
    mockUseAuth.mockReturnValue(authedUser)
    render(<Header />)
    fireEvent.click(screen.getByText("Logout"))
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Sign out failed:", expect.any(Error))
    })
    expect(mockNavigate).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it("falls back to email when name is not set", () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: "123", name: null, email: "test@example.com" } },
      isPending: false,
      isLoggedIn: true,
      userId: "123",
    })
    render(<Header />)
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
  })

  // ─── Debounced search navigation ──────────────────────────────────────────

  it("navigates to /recipes with search param after debounce fires", async () => {
    vi.useFakeTimers()
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)

    const input = screen.getByTestId("header-search-input")
    fireEvent.change(input, { target: { value: "chicken" } })
    expect(mockNavigate).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(300) })

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/recipes",
      search: expect.any(Function),
    })
    vi.useRealTimers()
  })

  it("trims whitespace before navigating and resets page", async () => {
    vi.useFakeTimers()
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)

    const input = screen.getByTestId("header-search-input")
    fireEvent.change(input, { target: { value: "  pasta  " } })
    act(() => { vi.advanceTimersByTime(300) })

    const callArg = mockNavigate.mock.calls[0][0]
    const prevSearch = { sort: "newest" }
    const result = callArg.search(prevSearch)
    expect(result.search).toBe("pasta")
    expect(result.page).toBeUndefined()
    vi.useRealTimers()
  })

  it("passes undefined for search when input is cleared", async () => {
    vi.useFakeTimers()
    // Start with active search so the input has a non-empty value to clear
    mockLocationSearch = { search: "chicken" }
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)

    const input = screen.getByTestId("header-search-input")
    expect(input).toHaveValue("chicken")

    mockNavigate.mockClear()
    fireEvent.change(input, { target: { value: "" } })
    act(() => { vi.advanceTimersByTime(300) })

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    const result = mockNavigate.mock.calls[0][0].search({})
    expect(result.search).toBeUndefined()
    vi.useRealTimers()
  })

  it("debounces rapid keystrokes — only one navigate call fires", async () => {
    vi.useFakeTimers()
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)

    const input = screen.getByTestId("header-search-input")
    fireEvent.change(input, { target: { value: "a" } })
    act(() => { vi.advanceTimersByTime(100) })
    fireEvent.change(input, { target: { value: "ab" } })
    act(() => { vi.advanceTimersByTime(100) })
    fireEvent.change(input, { target: { value: "abc" } })
    act(() => { vi.advanceTimersByTime(300) })

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  // ─── URL sync ─────────────────────────────────────────────────────────────

  it("populates input from URL search param on render", () => {
    mockLocationSearch = { search: "tacos" }
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)
    expect(screen.getByTestId("header-search-input")).toHaveValue("tacos")
  })

  it("shows no dot when URL has no search param", () => {
    mockLocationSearch = {}
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)
    expect(screen.queryByTestId("header-search-dot")).not.toBeInTheDocument()
  })

  it("shows dot(s) when URL has non-empty search param", () => {
    // In JSDOM both desktop and mobile dots render (no media queries applied)
    mockLocationSearch = { search: "pasta" }
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)
    expect(screen.getAllByTestId("header-search-dot").length).toBeGreaterThan(0)
  })

  it("does not show dot when search param is whitespace only", () => {
    mockLocationSearch = { search: "   " }
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)
    expect(screen.queryAllByTestId("header-search-dot")).toHaveLength(0)
  })

  // ─── Mobile overlay ────────────────────────────────────────────────────────

  it("opens mobile search overlay when search icon button is clicked", () => {
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)

    const iconBtn = screen.getByTestId("header-search-icon-btn")
    fireEvent.click(iconBtn)

    expect(screen.getByTestId("header-search-close-btn")).toBeInTheDocument()
    // icon btn is replaced by overlay
    expect(screen.queryByTestId("header-search-icon-btn")).not.toBeInTheDocument()
  })

  it("closes mobile overlay when close button is clicked", () => {
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)

    fireEvent.click(screen.getByTestId("header-search-icon-btn"))
    expect(screen.getByTestId("header-search-close-btn")).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("header-search-close-btn"))
    expect(screen.queryByTestId("header-search-close-btn")).not.toBeInTheDocument()
    expect(screen.getByTestId("header-search-icon-btn")).toBeInTheDocument()
  })

  it("closes mobile overlay when Escape is pressed in the overlay input", () => {
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)

    fireEvent.click(screen.getByTestId("header-search-icon-btn"))
    const overlayInput = screen.getByTestId("header-search-input")
    fireEvent.keyDown(overlayInput, { key: "Escape" })

    expect(screen.queryByTestId("header-search-close-btn")).not.toBeInTheDocument()
    expect(screen.getByTestId("header-search-icon-btn")).toBeInTheDocument()
  })

  it("preserves active search in input when overlay is closed", () => {
    mockLocationSearch = { search: "soup" }
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)

    fireEvent.click(screen.getByTestId("header-search-icon-btn"))
    fireEvent.click(screen.getByTestId("header-search-close-btn"))

    // After closing overlay, the desktop input should still show the search value
    expect(screen.getByTestId("header-search-input")).toHaveValue("soup")
  })

  // ─── Theme selector ────────────────────────────────────────────────────────

  it("renders theme selector with all THEMES options in the sidebar", () => {
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)

    // Open sidebar
    fireEvent.click(screen.getByLabelText("Open menu"))

    expect(screen.getByText("Dark")).toBeInTheDocument()
    expect(screen.getByText("Light (cool)")).toBeInTheDocument()
  })

  it("active theme button has distinguishing visual class", () => {
    mockTheme = 'dark'
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))

    const darkBtn = screen.getByRole("button", { name: "Dark" })
    const lightBtn = screen.getByRole("button", { name: "Light (cool)" })
    expect(darkBtn.className).not.toBe(lightBtn.className)
  })

  it("clicking a non-active theme calls setTheme with that theme id", () => {
    mockTheme = 'dark'
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))

    fireEvent.click(screen.getByRole("button", { name: "Light (cool)" }))
    expect(mockSetTheme).toHaveBeenCalledWith("light-cool")
  })

  it("each theme button has aria-pressed attribute", () => {
    mockUseAuth.mockReturnValue(defaultAuth)
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))

    const darkBtn = screen.getByRole("button", { name: "Dark" })
    const lightBtn = screen.getByRole("button", { name: "Light (cool)" })
    expect(darkBtn).toHaveAttribute("aria-pressed")
    expect(lightBtn).toHaveAttribute("aria-pressed")
  })
})
