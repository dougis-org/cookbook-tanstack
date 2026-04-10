import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

const mockNavigate = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { search: {} } }),
}))

const mockUseAuth = vi.fn()
const mockSignOut = vi.fn()

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock("@/lib/auth-client", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

import Header from "@/components/Header"

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows login and register links when not authenticated", () => {
    mockUseAuth.mockReturnValue({ session: null, isPending: false, isLoggedIn: false, userId: null })

    render(<Header />)

    expect(screen.getByText("Login")).toBeInTheDocument()
    expect(screen.getByText("Register")).toBeInTheDocument()
  })

  it("shows user name and logout when authenticated", () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: "123", name: "Test User", email: "test@example.com" } },
      isPending: false,
      isLoggedIn: true,
      userId: "123",
    })

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
    mockUseAuth.mockReturnValue({
      session: { user: { id: "123", name: "Test User", email: "test@example.com" } },
      isPending: false,
      isLoggedIn: true,
      userId: "123",
    })

    render(<Header />)
    fireEvent.click(screen.getByText("Logout"))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/auth/login" })
    })
  })

  it("does not navigate when sign-out fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    mockSignOut.mockRejectedValue(new Error("network error"))
    mockUseAuth.mockReturnValue({
      session: { user: { id: "123", name: "Test User", email: "test@example.com" } },
      isPending: false,
      isLoggedIn: true,
      userId: "123",
    })

    render(<Header />)
    fireEvent.click(screen.getByText("Logout"))

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Sign out failed:",
        expect.any(Error),
      )
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
})
