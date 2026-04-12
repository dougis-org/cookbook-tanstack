import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

const mockNavigate = vi.fn()
let mockAuthResult: { session: unknown; isPending: boolean } = { session: null, isPending: false }

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuthResult,
}))

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark", setTheme: vi.fn() }),
  THEMES: [{ id: "dark", label: "Dark" }],
}))

vi.mock("@/lib/auth-client", () => ({
  signOut: vi.fn(),
}))

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
  useRouterState: () => ({}),
}))

import Header from "@/components/Header"

const mockSession = {
  user: { id: "user-1", email: "test@example.com", name: "Test User" },
  session: { id: "session-1", userId: "user-1", expiresAt: new Date() },
}

describe("Header nav visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthResult = { session: null, isPending: false }
  })

  it("does not show New Recipe link when session is null", () => {
    render(<Header />)
    expect(screen.queryByText("New Recipe")).not.toBeInTheDocument()
  })

  it("does not show Import Recipe link when session is null", () => {
    render(<Header />)
    expect(screen.queryByText("Import Recipe")).not.toBeInTheDocument()
  })

  it("shows New Recipe link when session is non-null", () => {
    mockAuthResult = { session: mockSession, isPending: false }
    render(<Header />)
    expect(screen.getByText("New Recipe")).toBeInTheDocument()
  })

  it("shows Import Recipe link when session is non-null", () => {
    mockAuthResult = { session: mockSession, isPending: false }
    render(<Header />)
    expect(screen.getByText("Import Recipe")).toBeInTheDocument()
  })

  it("does not show New Recipe or Import Recipe when isPending is true", () => {
    mockAuthResult = { session: null, isPending: true }
    render(<Header />)
    expect(screen.queryByText("New Recipe")).not.toBeInTheDocument()
    expect(screen.queryByText("Import Recipe")).not.toBeInTheDocument()
  })
})
