import type { ComponentType, ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const mockUseSearch = vi.fn()

vi.mock("@tanstack/react-router", async () => {
  const { createRouterMock } = await import("@/test-helpers/mocks")

  return {
    ...createRouterMock({
      extras: {
        createFileRoute: () => (routeOpts: Record<string, unknown>) => ({
          options: routeOpts,
          useSearch: () => mockUseSearch(),
        }),
      },
    }),
  }
})

vi.mock("@/components/auth/ResetPasswordForm", () => ({
  default: ({ token }: { token: string }) => (
    <div data-testid="reset-password-form">reset form token: {token}</div>
  ),
}))

vi.mock("@/components/auth/AuthPageLayout", () => ({
  default: ({
    title,
    children,
  }: {
    title: string
    children: ReactNode
  }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}))

import { Route } from "@/routes/auth/reset-password"

const ResetPasswordPage = Route.options.component as ComponentType

describe("reset-password route", () => {
  it("renders the invalid-token state when no token is present", () => {
    mockUseSearch.mockReturnValue({ token: undefined })

    render(<ResetPasswordPage />)

    expect(screen.getByText(/invalid or missing reset token/i)).toBeInTheDocument()
    expect(screen.queryByTestId("reset-password-form")).not.toBeInTheDocument()
  })

  it("renders ResetPasswordForm when a token is present", () => {
    mockUseSearch.mockReturnValue({ token: "reset-token" })

    render(<ResetPasswordPage />)

    expect(screen.getByTestId("reset-password-form")).toHaveTextContent(
      "reset form token: reset-token",
    )
    expect(
      screen.queryByText(/invalid or missing reset token/i),
    ).not.toBeInTheDocument()
  })
})
