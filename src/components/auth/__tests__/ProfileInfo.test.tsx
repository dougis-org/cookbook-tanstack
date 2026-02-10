import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const mockUseSession = vi.fn()

vi.mock("@/lib/auth-client", () => ({
  useSession: () => mockUseSession(),
}))

import ProfileInfo from "@/components/auth/ProfileInfo"

describe("ProfileInfo", () => {
  it("shows loading skeleton when session is pending", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true })

    const { container } = render(<ProfileInfo />)

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("renders nothing when no session", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false })

    const { container } = render(<ProfileInfo />)

    expect(container.innerHTML).toBe("")
  })

  it("displays user information", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
          username: "testuser",
          image: null,
          createdAt: "2026-01-01T00:00:00Z",
        },
        session: { id: "123" },
      },
      isPending: false,
    })

    render(<ProfileInfo />)

    expect(screen.getByText("Test User")).toBeInTheDocument()
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.getByText("testuser")).toBeInTheDocument()
  })

  it("displays avatar when image is available", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
          image: "https://example.com/avatar.jpg",
          createdAt: "2026-01-01T00:00:00Z",
        },
        session: { id: "123" },
      },
      isPending: false,
    })

    render(<ProfileInfo />)

    const avatar = screen.getByAltText("Test User")
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg")
  })
})
