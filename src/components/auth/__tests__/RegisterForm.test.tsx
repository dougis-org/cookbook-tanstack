import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

const mockNavigate = vi.fn()
const mockSignUpEmail = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]) => mockSignUpEmail(...args),
    },
  },
}))

import RegisterForm from "@/components/auth/RegisterForm"

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignUpEmail.mockResolvedValue({})
  })

  it("renders all form fields", () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText("Name")).toBeInTheDocument()
    expect(screen.getByLabelText(/^username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument()
  })

  it("shows validation errors on empty submit", async () => {
    render(<RegisterForm />)

    fireEvent.click(screen.getByRole("button", { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument()
      expect(screen.getByText("Username is required")).toBeInTheDocument()
      expect(screen.getByText("Password is required")).toBeInTheDocument()
    })

    expect(mockSignUpEmail).not.toHaveBeenCalled()
  })

  it("validates email format", async () => {
    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "invalid" } })
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: "testuser" } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } })
    fireEvent.click(screen.getByRole("button", { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email")).toBeInTheDocument()
    })
  })

  it("validates password length", async () => {
    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: "testuser" } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "short" } })
    fireEvent.click(screen.getByRole("button", { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument()
    })
  })

  it("validates username length", async () => {
    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: "ab" } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } })
    fireEvent.click(screen.getByRole("button", { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText("Username must be at least 3 characters")).toBeInTheDocument()
    })
  })

  it("calls signUp on valid submission", async () => {
    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test User" } })
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: "testuser" } })
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } })
    fireEvent.click(screen.getByRole("button", { name: /create account/i }))

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith(
        {
          email: "test@example.com",
          password: "password123",
          name: "Test User",
          username: "testuser",
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      )
    })
  })

  it("shows server error messages", async () => {
    mockSignUpEmail.mockImplementation((_data: unknown, callbacks: { onError: (ctx: { error: { message: string } }) => void }) => {
      callbacks.onError({ error: { message: "User already exists" } })
    })

    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: "testuser" } })
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "test@example.com" } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } })
    fireEvent.click(screen.getByRole("button", { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("User already exists")
    })
  })

  it("has a link to the login page", () => {
    render(<RegisterForm />)
    const link = screen.getByText("Sign in")
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/auth/login")
  })
})
