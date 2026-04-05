import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
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
