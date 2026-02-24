import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import CookbookFields from "@/components/cookbooks/CookbookFields"

function renderFields(overrides: Partial<Parameters<typeof CookbookFields>[0]> = {}) {
  const props = {
    name: "",
    description: "",
    isPublic: true,
    checkboxId: "test-public",
    onNameChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onIsPublicChange: vi.fn(),
    ...overrides,
  }
  render(<CookbookFields {...props} />)
  return props
}

describe("CookbookFields", () => {
  it("renders name input with provided value", () => {
    renderFields({ name: "My Cookbook" })
    expect(screen.getByPlaceholderText("My Cookbook")).toHaveValue("My Cookbook")
  })

  it("renders description textarea with provided value", () => {
    renderFields({ description: "A great collection" })
    expect(screen.getByPlaceholderText("Optional description")).toHaveValue("A great collection")
  })

  it("renders public checkbox checked when isPublic is true", () => {
    renderFields({ isPublic: true, checkboxId: "pub-check" })
    expect(screen.getByRole("checkbox")).toBeChecked()
  })

  it("renders public checkbox unchecked when isPublic is false", () => {
    renderFields({ isPublic: false, checkboxId: "pub-check" })
    expect(screen.getByRole("checkbox")).not.toBeChecked()
  })

  it("calls onNameChange when name input changes", () => {
    const onNameChange = vi.fn()
    renderFields({ onNameChange })
    fireEvent.change(screen.getByPlaceholderText("My Cookbook"), { target: { value: "New Name" } })
    expect(onNameChange).toHaveBeenCalledWith("New Name")
  })

  it("calls onDescriptionChange when description textarea changes", () => {
    const onDescriptionChange = vi.fn()
    renderFields({ onDescriptionChange })
    fireEvent.change(screen.getByPlaceholderText("Optional description"), { target: { value: "Desc" } })
    expect(onDescriptionChange).toHaveBeenCalledWith("Desc")
  })

  it("calls onIsPublicChange when checkbox is toggled", () => {
    const onIsPublicChange = vi.fn()
    renderFields({ isPublic: true, onIsPublicChange, checkboxId: "pub-cb" })
    fireEvent.click(screen.getByRole("checkbox"))
    expect(onIsPublicChange).toHaveBeenCalledWith(false)
  })

  it("checkbox label is associated with the checkboxId", () => {
    renderFields({ checkboxId: "my-checkbox-id" })
    const label = screen.getByText("Public (visible to everyone)")
    expect(label).toHaveAttribute("for", "my-checkbox-id")
  })

  it("name input has maxLength of 255", () => {
    renderFields()
    expect(screen.getByPlaceholderText("My Cookbook")).toHaveAttribute("maxLength", "255")
  })

  it("description textarea has maxLength of 500", () => {
    renderFields()
    expect(screen.getByPlaceholderText("Optional description")).toHaveAttribute("maxLength", "500")
  })
})
