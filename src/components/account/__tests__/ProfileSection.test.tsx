import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const mockUseAuth = vi.fn()

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}))

import ProfileSection from "@/components/account/ProfileSection"

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

  it("falls back to the placeholder icon when image is from an untrusted host", () => {
    // No avatar-hosting provider is configured yet (TRUSTED_AVATAR_HOSTS is
    // empty), so even a well-formed https URL from an arbitrary host must
    // not render as <img src>.
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

    expect(screen.queryByAltText("Test User")).not.toBeInTheDocument()
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
