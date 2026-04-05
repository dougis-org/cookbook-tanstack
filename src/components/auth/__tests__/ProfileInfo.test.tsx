import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const mockUseAuth = vi.fn()

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}))

import ProfileInfo from "@/components/auth/ProfileInfo"

describe("ProfileInfo", () => {
  it("shows loading skeleton when session is pending", () => {
    mockUseAuth.mockReturnValue({ session: null, isPending: true, isLoggedIn: false, userId: null })

    const { container } = render(<ProfileInfo />)

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("renders nothing when no session", () => {
    mockUseAuth.mockReturnValue({ session: null, isPending: false, isLoggedIn: false, userId: null })

    const { container } = render(<ProfileInfo />)

    expect(container.innerHTML).toBe("")
  })

  it("displays user information", () => {
    mockUseAuth.mockReturnValue({
      session: {
        user: {
          id: "123",
          name: "Test User",
          email: "test@example.com",
          username: "testuser",
          image: null,
          createdAt: "2026-01-01T00:00:00Z",
        },
      },
      isPending: false,
      isLoggedIn: true,
      userId: "123",
    })

    render(<ProfileInfo />)

    expect(screen.getByText("Test User")).toBeInTheDocument()
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.getByText("testuser")).toBeInTheDocument()
    expect(screen.getByText(/Member since 2026-01-01/)).toBeInTheDocument()
  })

  it("displays avatar when image is available", () => {
    mockUseAuth.mockReturnValue({
      session: {
        user: {
          id: "123",
          name: "Test User",
          email: "test@example.com",
          image: "https://example.com/avatar.jpg",
          createdAt: "2026-01-01T00:00:00Z",
        },
      },
      isPending: false,
      isLoggedIn: true,
      userId: "123",
    })

    render(<ProfileInfo />)

    const avatar = screen.getByAltText("Test User")
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg")
  })
})
