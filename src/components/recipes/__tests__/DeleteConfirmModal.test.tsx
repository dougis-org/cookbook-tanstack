import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import DeleteConfirmModal from "@/components/recipes/DeleteConfirmModal"

describe("DeleteConfirmModal", () => {
  it("does not render when not open", () => {
    render(
      <DeleteConfirmModal
        open={false}
        recipeName="Test"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByText("Delete Recipe")).not.toBeInTheDocument()
  })

  it("renders recipe name and warning when open", () => {
    render(
      <DeleteConfirmModal
        open={true}
        recipeName="Pasta Carbonara"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByText("Delete Recipe")).toBeInTheDocument()
    expect(screen.getByText(/Pasta Carbonara/)).toBeInTheDocument()
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
  })

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn()
    render(
      <DeleteConfirmModal
        open={true}
        recipeName="Test"
        onConfirm={vi.fn()}
        onCancel={onCancel}
        isPending={false}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("calls onConfirm when delete button is clicked", () => {
    const onConfirm = vi.fn()
    render(
      <DeleteConfirmModal
        open={true}
        recipeName="Test"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        isPending={false}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /delete/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("disables buttons when pending", () => {
    render(
      <DeleteConfirmModal
        open={true}
        recipeName="Test"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isPending={true}
      />,
    )

    expect(screen.getByRole("button", { name: /deleting/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled()
  })
})
