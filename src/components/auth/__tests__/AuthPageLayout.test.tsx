import type { ReactNode } from "react"
import { User } from "lucide-react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/layout/PageLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="page-layout">{children}</div>,
}))

import AuthPageLayout from "@/components/auth/AuthPageLayout"

describe("AuthPageLayout", () => {
  it("renders the Lucide icon, title, and children", () => {
    const { container } = render(
      <AuthPageLayout icon={User} title="Sign in">
        <p>Continue to your account</p>
      </AuthPageLayout>,
    )

    expect(screen.getByTestId("page-layout")).toBeInTheDocument()
    expect(screen.getByText("Sign in")).toBeInTheDocument()
    expect(screen.getByText("Continue to your account")).toBeInTheDocument()

    const icon = container.querySelector("svg")
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass("w-6", "h-6")
    expect(icon?.className).toContain('text-[var(--theme-accent)]')
  })
})
