import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const mockUseAuth = vi.fn()

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}))

import ProfileSection, { safeImageUrl } from "@/components/account/ProfileSection"

describe("safeImageUrl", () => {
  it("allows a well-formed https URL", () => {
    expect(safeImageUrl("https://cdn.example.com/avatar.jpg")).toBe("https://cdn.example.com/avatar.jpg")
  })

  it("rejects http URLs", () => {
    expect(safeImageUrl("http://cdn.example.com/avatar.jpg")).toBeNull()
  })

  it("rejects malformed URLs and empty/null input", () => {
    expect(safeImageUrl("not a url")).toBeNull()
    expect(safeImageUrl("javascript:alert(1)")).toBeNull()
    expect(safeImageUrl(null)).toBeNull()
    expect(safeImageUrl(undefined)).toBeNull()
  })
})

describe("ProfileSection", () => {
  it("shows loading skeleton when session is pending", () => {
    mockUseAuth.mockReturnValue({ session: null, isPending: true, isLoggedIn: false, userId: null })

    const { container } = render(<ProfileSection />)

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("renders nothing when no session", () => {
    mockUseAuth.mockReturnValue({ session: null, isPending: false, isLoggedIn: false, userId: null })

    const { container } = render(<ProfileSection />)

    expect(container.innerHTML).toBe("")
  })

  it("shows a fallback label when the user has no name", () => {
    mockUseAuth.mockReturnValue({
      session: {
        user: {
          id: "123",
          name: null,
          email: "test@example.com",
          image: null,
          createdAt: "2026-01-01T00:00:00Z",
        },
      },
      isPending: false,
      isLoggedIn: true,
      userId: "123",
    })

    render(<ProfileSection />)

    expect(screen.getByText("No name set")).toBeInTheDocument()
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

    render(<ProfileSection />)

    expect(screen.getByText("Test User")).toBeInTheDocument()
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    expect(screen.getByText("testuser")).toBeInTheDocument()
    expect(screen.getByText(/Member since 2026-01-01/)).toBeInTheDocument()
  })

  it("displays avatar when image is a well-formed https URL", () => {
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

    render(<ProfileSection />)

    const avatar = screen.getByAltText("Test User")
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg")
  })

  it("falls back to the placeholder icon for non-https or malformed image URLs", () => {
    for (const image of ["javascript:alert(1)", "http://example.com/avatar.jpg", "not a url"]) {
      mockUseAuth.mockReturnValue({
        session: {
          user: {
            id: "123",
            name: "Test User",
            email: "test@example.com",
            image,
            createdAt: "2026-01-01T00:00:00Z",
          },
        },
        isPending: false,
        isLoggedIn: true,
        userId: "123",
      })

      const { unmount } = render(<ProfileSection />)
      expect(screen.queryByAltText("Test User")).not.toBeInTheDocument()
      unmount()
    }
  })

  it("shows N/A for member-since when createdAt is malformed", () => {
    mockUseAuth.mockReturnValue({
      session: {
        user: {
          id: "123",
          name: "Test User",
          email: "test@example.com",
          image: null,
          createdAt: "not-a-date",
        },
      },
      isPending: false,
      isLoggedIn: true,
      userId: "123",
    })

    expect(() => render(<ProfileSection />)).not.toThrow()
    expect(screen.getByText("Member since N/A")).toBeInTheDocument()
  })
})
