import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { createRouterMock } from "@/test-helpers/mocks"
import { mockAuthClient, mockSignUpEmail, setupAuthCallbacks } from "@/test-helpers/auth"
import RegisterForm from "@/components/auth/RegisterForm"

const mockNavigate = vi.fn()
const validRegistration = {
  name: "Test User",
  username: "testuser",
  email: "test@example.com",
  password: "password123",
}

vi.mock("@tanstack/react-router", () => ({
  ...createRouterMock(),
  useNavigate: () => mockNavigate,
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: mockAuthClient,
}))

function fillRegistrationForm(fields: Partial<typeof validRegistration> = {}) {
  const values = { ...validRegistration, ...fields }

  if (values.name) {
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: values.name } })
  }
  fireEvent.change(screen.getByLabelText(/^Username/), { target: { value: values.username } })
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: values.email } })
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: values.password } })
}

function submitRegistration() {
  fireEvent.click(screen.getByRole("button", { name: /create account/i }))
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignUpEmail.mockResolvedValue({})
  })

  it("renders all form fields", () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText("Name")).toBeInTheDocument()
    expect(screen.getByLabelText(/^Username/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument()
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
    fillRegistrationForm({ email: "invalid" })
    submitRegistration()
    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email")).toBeInTheDocument()
    })
  })

  it("validates password length", async () => {
    render(<RegisterForm />)
    fillRegistrationForm({ password: "short" })
    submitRegistration()
    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument()
    })
  })

  it("validates username length", async () => {
    render(<RegisterForm />)
    fillRegistrationForm({ username: "ab" })
    submitRegistration()
    await waitFor(() => {
      expect(screen.getByText("Username must be at least 3 characters")).toBeInTheDocument()
    })
  })

  it("calls signUp on valid submission", async () => {
    render(<RegisterForm />)
    fillRegistrationForm()
    submitRegistration()
    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith(
        { email: "test@example.com", password: "password123", name: "Test User", username: "testuser", displayUsername: "testuser" },
        expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
      )
    })
  })

  it("replaces the form with a check-email message after successful registration", async () => {
    setupAuthCallbacks(mockSignUpEmail, 'success')

    render(<RegisterForm />)
    fillRegistrationForm({ name: "" })
    submitRegistration()

    await waitFor(() => {
      expect(screen.getByText(/check your/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/test@example\.com/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /create account/i })).not.toBeInTheDocument()
  })

  it("does not navigate after successful registration", async () => {
    setupAuthCallbacks(mockSignUpEmail, 'success')

    render(<RegisterForm />)
    fillRegistrationForm({ name: "" })
    submitRegistration()

    await waitFor(() => {
      expect(screen.getByText(/check your/i)).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("shows server error messages", async () => {
    setupAuthCallbacks(mockSignUpEmail, 'error', "User already exists")

    render(<RegisterForm />)
    fillRegistrationForm({ name: "" })
    submitRegistration()
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("User already exists")
    })
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument()
    expect(screen.queryByText(/check your/i)).not.toBeInTheDocument()
  })

  it("clears loading state when registration throws", async () => {
    mockSignUpEmail.mockRejectedValue(new Error("Network error"))

    render(<RegisterForm />)
    fillRegistrationForm({ name: "" })
    submitRegistration()

    expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled()
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Network error")
    })
    expect(screen.getByRole("button", { name: /create account/i })).not.toBeDisabled()
  })

  it("has a link to the login page", () => {
    render(<RegisterForm />)
    expect(screen.getByText("Sign in")).toHaveAttribute("href", "/auth/login")
  })

  it("renders benefits sidebar with 5 bullet points and check icons", () => {
    const { container } = render(<RegisterForm />)
    expect(screen.getByText("Why join My CookBooks?")).toBeInTheDocument()
    
    // Check for the 5 benefits
    expect(screen.getByText(/Organize recipes in custom cookbooks/i)).toBeInTheDocument()
    expect(screen.getByText(/Print high-fidelity recipe cards/i)).toBeInTheDocument()
    expect(screen.getByText(/Keep recipes private or share with the public/i)).toBeInTheDocument()
    expect(screen.getByText(/Plan weekly meals/i)).toBeInTheDocument()
    expect(screen.getByText(/Access your kitchen dashboard/i)).toBeInTheDocument()

    // Assert that check icons are rendered
    const icons = container.querySelectorAll("svg")
    expect(icons.length).toBeGreaterThanOrEqual(5)
  })

  it("renders legal consent links pointing to #", () => {
    render(<RegisterForm />)
    const termsLink = screen.getByRole("link", { name: "Terms" })
    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" })
    
    expect(termsLink).toBeInTheDocument()
    expect(termsLink).toHaveAttribute("href", "#")
    expect(privacyLink).toBeInTheDocument()
    expect(privacyLink).toHaveAttribute("href", "#")
    
    expect(screen.getByText(/By creating an account you agree to our/i)).toBeInTheDocument()
  })
})
