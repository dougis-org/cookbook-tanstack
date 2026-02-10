import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}))

const mockUseSession = vi.fn()
const mockSignOut = vi.fn()

vi.mock("@/lib/auth-client", () => ({
  useSession: () => mockUseSession(),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

import Header from "@/components/Header"

describe("Header", () => {
  it("shows login and register links when not authenticated", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false })

    render(<Header />)

    expect(screen.getByText("Login")).toBeInTheDocument()
    expect(screen.getByText("Register")).toBeInTheDocument()
  })

  it("shows user name and logout when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: "Test User", email: "test@example.com" },
        session: { id: "123" },
      },
      isPending: false,
    })

    render(<Header />)

    expect(screen.getByText("Test User")).toBeInTheDocument()
    expect(screen.getByText("Logout")).toBeInTheDocument()
    expect(screen.queryByText("Login")).not.toBeInTheDocument()
    expect(screen.queryByText("Register")).not.toBeInTheDocument()
  })

  it("shows nothing while session is loading", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true })

    render(<Header />)

    expect(screen.queryByText("Login")).not.toBeInTheDocument()
    expect(screen.queryByText("Logout")).not.toBeInTheDocument()
  })

  it("falls back to email when name is not set", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: null, email: "test@example.com" },
        session: { id: "123" },
      },
      isPending: false,
    })

    render(<Header />)

    expect(screen.getByText("test@example.com")).toBeInTheDocument()
  })
})
