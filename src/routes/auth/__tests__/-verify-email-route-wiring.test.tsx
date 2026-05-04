import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { verifiedAuth } from "@/test-helpers/auth"

// Mock with from in search so we can verify it reaches VerifyEmailPage
vi.mock("@tanstack/react-router", async () => {
  const { createRouterMock } = await import("@/test-helpers/mocks")
  return createRouterMock({ search: { from: "/recipes/new", error: undefined } })
})

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => verifiedAuth,
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: () => ({ data: null }) },
}))

vi.mock("@/components/auth/AuthPageLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import { Route } from "@/routes/auth/verify-email"

describe("VerifyEmailRoute — from search wiring", () => {
  it("forwards from search param to the Continue link", () => {
    const RouteComponent = Route.options.component as () => React.ReactElement
    render(<RouteComponent />)
    expect(screen.getByRole("link", { name: /continue/i })).toHaveAttribute(
      "href",
      "/recipes/new",
    )
  })
})
