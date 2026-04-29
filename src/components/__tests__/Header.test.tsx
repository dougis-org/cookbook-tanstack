import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

const mockNavigate = vi.fn()
let mockAuthResult: { session: unknown; isPending: boolean } = { session: null, isPending: false }
let mockSetTheme = vi.fn()
let mockCurrentTheme = "dark"

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuthResult,
}))

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: mockCurrentTheme, setTheme: mockSetTheme }),
  THEMES: [
    { id: "dark", label: "Dark" },
    { id: "light-cool", label: "Light (cool)" },
    { id: "light-warm", label: "Light (warm)" },
  ],
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
    mockCurrentTheme = "dark"
    mockSetTheme = vi.fn()
    document.documentElement.className = "dark"
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

describe("Header admin nav link", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthResult = { session: null, isPending: false }
    mockCurrentTheme = "dark"
    mockSetTheme = vi.fn()
    document.documentElement.className = "dark"
  })

  const adminSession = {
    user: { id: "admin-1", email: "admin@example.com", name: "Admin User", isAdmin: true },
    session: { id: "session-1", userId: "admin-1", expiresAt: new Date() },
  }
  const nonAdminSession = {
    user: { id: "user-1", email: "user@example.com", name: "Regular User", isAdmin: false },
    session: { id: "session-1", userId: "user-1", expiresAt: new Date() },
  }

  it("renders admin link when isAdmin is true and session is loaded", () => {
    mockAuthResult = { session: adminSession, isPending: false }
    render(<Header />)
    expect(screen.getByText("Admin")).toBeInTheDocument()
  })

  it("does not render admin link when isAdmin is false", () => {
    mockAuthResult = { session: nonAdminSession, isPending: false }
    render(<Header />)
    expect(screen.queryByText("Admin")).not.toBeInTheDocument()
  })

  it("does not render admin link when isAdmin is absent/undefined", () => {
    mockAuthResult = {
      session: {
        user: { id: "user-1", email: "user@example.com", name: "User" },
        session: { id: "session-1", userId: "user-1", expiresAt: new Date() },
      },
      isPending: false,
    }
    render(<Header />)
    expect(screen.queryByText("Admin")).not.toBeInTheDocument()
  })

  it("does not render admin link when isPending is true", () => {
    mockAuthResult = { session: null, isPending: true }
    render(<Header />)
    expect(screen.queryByText("Admin")).not.toBeInTheDocument()
  })

  it("does not render admin link when session is null (unauthenticated)", () => {
    mockAuthResult = { session: null, isPending: false }
    render(<Header />)
    expect(screen.queryByText("Admin")).not.toBeInTheDocument()
  })
})

describe("Header sidebar backdrop", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthResult = { session: null, isPending: false }
    mockCurrentTheme = "dark"
    mockSetTheme = vi.fn()
    document.documentElement.className = "dark"
  })

  it("TC-08: backdrop has aria-hidden when sidebar is open", () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))
    const backdrop = document.querySelector('div[aria-hidden="true"].fixed')
    expect(backdrop).toBeInTheDocument()
    expect(backdrop).toHaveAttribute("aria-hidden", "true")
  })

  it("TC-08b: backdrop is absent from DOM when sidebar is closed", () => {
    render(<Header />)
    expect(document.querySelector('div[aria-hidden="true"].fixed')).not.toBeInTheDocument()
  })

  it("clicking the backdrop closes the sidebar", () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))
    const backdrop = document.querySelector('div[aria-hidden="true"].fixed') as HTMLElement
    expect(backdrop).toBeInTheDocument()
    fireEvent.click(backdrop)
    expect(document.querySelector('div[aria-hidden="true"].fixed')).not.toBeInTheDocument()
  })

  it("pressing OK after selecting a different theme closes the sidebar", () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))
    expect(document.querySelector('div[aria-hidden="true"].fixed')).toBeInTheDocument()
    // Open dropdown and select a different theme
    fireEvent.click(screen.getByTestId("theme-dropdown-trigger"))
    fireEvent.click(screen.getByRole("option", { name: "Light (cool)" }))
    // OK should be visible since we have a pending preview
    fireEvent.click(screen.getByRole("button", { name: "OK" }))
    expect(document.querySelector('div[aria-hidden="true"].fixed')).not.toBeInTheDocument()
  })
})

describe("Header theme dropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthResult = { session: null, isPending: false }
    mockCurrentTheme = "dark"
    mockSetTheme = vi.fn()
    document.documentElement.className = "dark"
  })

  function openDropdown() {
    fireEvent.click(screen.getByTestId("theme-dropdown-trigger"))
  }

  // T2a
  it("dropdown renders one option per THEMES entry with visible label", () => {
    render(<Header />)
    openDropdown()
    expect(screen.getByRole("option", { name: /dark/i })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /light \(cool\)/i })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /light \(warm\)/i })).toBeInTheDocument()
  })

  // T2b
  it("each option has a swatch span with the correct data-theme attribute", () => {
    render(<Header />)
    openDropdown()
    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(3)
    const themeIds = ["dark", "light-cool", "light-warm"]
    options.forEach((option, i) => {
      const swatch = option.querySelector("span[data-theme]")
      expect(swatch).not.toBeNull()
      expect(swatch).toHaveAttribute("data-theme", themeIds[i])
    })
  })

  // T2c
  it("selecting a non-committed option mutates document.documentElement.className", () => {
    render(<Header />)
    openDropdown()
    fireEvent.click(screen.getByRole("option", { name: "Light (cool)" }))
    expect(document.documentElement.className).toBe("light-cool")
  })

  // T2d
  it("selecting the already-committed theme does not render OK or Cancel", () => {
    render(<Header />)
    openDropdown()
    // Click the committed "dark" option
    fireEvent.click(screen.getByRole("option", { name: "Dark" }))
    expect(screen.queryByRole("button", { name: "OK" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument()
  })

  // T2e
  it("OK button calls setTheme with previewId and calls setIsOpen(false)", () => {
    render(<Header />)
    // Open sidebar so backdrop (isOpen indicator) is present
    fireEvent.click(screen.getByLabelText("Open menu"))
    openDropdown()
    fireEvent.click(screen.getByRole("option", { name: "Light (cool)" }))
    fireEvent.click(screen.getByRole("button", { name: "OK" }))
    expect(mockSetTheme).toHaveBeenCalledWith("light-cool")
    // Sidebar should be closed (backdrop gone)
    expect(document.querySelector('div[aria-hidden="true"].fixed')).not.toBeInTheDocument()
  })

  // T2f
  it("Cancel button reverts document.documentElement.className to committed theme and closes sidebar", () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))
    openDropdown()
    // Select a different theme (preview)
    fireEvent.click(screen.getByRole("option", { name: "Light (warm)" }))
    expect(document.documentElement.className).toBe("light-warm")
    // Cancel should revert
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(document.documentElement.className).toBe("dark")
    // Sidebar closes
    expect(document.querySelector('div[aria-hidden="true"].fixed')).not.toBeInTheDocument()
  })

  // T2g
  it("Escape key while dropdown is open with pending preview reverts class and closes sidebar", () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))
    openDropdown()
    fireEvent.click(screen.getByRole("option", { name: "Light (cool)" }))
    expect(document.documentElement.className).toBe("light-cool")
    // Fire Escape on the listbox container
    const listbox = screen.getByRole("listbox")
    fireEvent.keyDown(listbox, { key: "Escape" })
    expect(document.documentElement.className).toBe("dark")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(document.querySelector('div[aria-hidden="true"].fixed')).not.toBeInTheDocument()
  })

  // T2h
  it("unmounting Header while preview is active reverts document.documentElement.className", () => {
    const { unmount } = render(<Header />)
    openDropdown()
    fireEvent.click(screen.getByRole("option", { name: "Light (warm)" }))
    expect(document.documentElement.className).toBe("light-warm")
    unmount()
    expect(document.documentElement.className).toBe("dark")
  })

  // T2i
  it("trigger button has aria-expanded=false when closed, aria-expanded=true when open", () => {
    render(<Header />)
    const trigger = screen.getByTestId("theme-dropdown-trigger")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })

  // T2j
  it("options container has role=listbox and each option has role=option with correct aria-selected", () => {
    render(<Header />)
    openDropdown()
    const listbox = screen.getByRole("listbox")
    expect(listbox).toBeInTheDocument()
    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(3)
    // The committed theme (dark) should have aria-selected=true; others false
    expect(options[0]).toHaveAttribute("aria-selected", "true")  // dark
    expect(options[1]).toHaveAttribute("aria-selected", "false") // light-cool
    expect(options[2]).toHaveAttribute("aria-selected", "false") // light-warm
  })

  // T2k
  it("ArrowDown moves keyboard focus to the next option", () => {
    render(<Header />)
    openDropdown()
    const options = screen.getAllByRole("option")
    // First option (dark) has tabIndex=0 initially
    expect(options[0]).toHaveAttribute("tabIndex", "0")

    const listbox = screen.getByRole("listbox")
    fireEvent.keyDown(listbox, { key: "ArrowDown" })

    expect(options[0]).toHaveAttribute("tabIndex", "-1")
    expect(options[1]).toHaveAttribute("tabIndex", "0")
  })

  // T2k2
  it("ArrowUp moves keyboard focus to the previous option", () => {
    render(<Header />)
    openDropdown()
    const options = screen.getAllByRole("option")
    const listbox = screen.getByRole("listbox")

    // Move focus to second option, then ArrowUp back to first
    fireEvent.keyDown(listbox, { key: "ArrowDown" })
    expect(options[1]).toHaveAttribute("tabIndex", "0")
    fireEvent.keyDown(listbox, { key: "ArrowUp" })

    expect(options[1]).toHaveAttribute("tabIndex", "-1")
    expect(options[0]).toHaveAttribute("tabIndex", "0")
  })

  // T2l
  it("Enter while dropdown is open selects the active option", () => {
    render(<Header />)
    openDropdown()
    const listbox = screen.getByRole("listbox")

    // Arrow down to light-cool (index 1)
    fireEvent.keyDown(listbox, { key: "ArrowDown" })
    // Press Enter to select
    fireEvent.keyDown(listbox, { key: "Enter" })

    expect(document.documentElement.className).toBe("light-cool")
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument()
  })
})

describe("Header sidebar Pricing link", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthResult = { session: null, isPending: false }
    mockCurrentTheme = "dark"
    mockSetTheme = vi.fn()
    document.documentElement.className = "dark"
  })

  it("shows Pricing link for unauthenticated user", () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))
    expect(screen.getByRole("link", { name: /pricing/i })).toBeInTheDocument()
  })

  it("shows Pricing link for authenticated user", () => {
    mockAuthResult = { session: { user: { id: "user-1", email: "test@example.com", name: "Test User" } }, isPending: false }
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))
    expect(screen.getByRole("link", { name: /pricing/i })).toBeInTheDocument()
  })

  it("Pricing link navigates to /pricing", () => {
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))
    const pricingLink = screen.getByRole("link", { name: /pricing/i })
    expect(pricingLink).toHaveAttribute("href", "/pricing")
  })

  it("Pricing link appears between Cookbooks and New Recipe links", () => {
    mockAuthResult = { session: { user: { id: "user-1", email: "test@example.com", name: "Test User" } }, isPending: false }
    render(<Header />)
    fireEvent.click(screen.getByLabelText("Open menu"))
    const navLinks = screen.getAllByRole("link")
    const cookbooksIndex = navLinks.findIndex(link => link.textContent?.includes("Cookbooks"))
    const pricingIndex = navLinks.findIndex(link => link.textContent?.includes("Pricing"))
    const newRecipeIndex = navLinks.findIndex(link => link.textContent?.includes("New Recipe"))
    expect(cookbooksIndex).toBeGreaterThan(-1)
    expect(pricingIndex).toBeGreaterThan(-1)
    expect(newRecipeIndex).toBeGreaterThan(-1)
    expect(cookbooksIndex).toBeLessThan(pricingIndex)
    expect(pricingIndex).toBeLessThan(newRecipeIndex)
  })

  it("Pricing link click closes the sidebar menu", () => {
    render(<Header />)
    // Open sidebar first
    fireEvent.click(screen.getByLabelText("Open menu"))
    // Verify sidebar is open
    expect(document.querySelector('div[aria-hidden="true"].fixed')).toBeInTheDocument()
    // Click the Pricing link
    fireEvent.click(screen.getByRole("link", { name: /pricing/i }))
    // Verify sidebar is closed
    expect(document.querySelector('div[aria-hidden="true"].fixed')).not.toBeInTheDocument()
  })
})
