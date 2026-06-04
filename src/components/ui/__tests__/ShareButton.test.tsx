import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import ShareButton from "../ShareButton"

describe("ShareButton", () => {
  const mockHref = "http://localhost:3000/recipes/123"
  let originalClipboard: typeof navigator.clipboard | undefined
  let originalExecCommand: typeof document.execCommand

  beforeEach(() => {
    // Save original values
    originalClipboard = navigator.clipboard
    originalExecCommand = document.execCommand

    // Set up location.href
    vi.stubGlobal("location", {
      ...window.location,
      href: mockHref,
    })

    // Stub window.alert
    vi.stubGlobal("alert", vi.fn())
  })

  afterEach(() => {
    // Restore originals
    if (originalClipboard !== undefined) {
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        configurable: true,
        writable: true,
      })
    } else {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
        writable: true,
      })
    }
    document.execCommand = originalExecCommand

    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("renders a button with 'Share' label by default", () => {
    render(<ShareButton />)
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument()
  })

  it("renders the Link icon inside the button initially", () => {
    const { container } = render(<ShareButton />)
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("successfully copies URL via navigator.clipboard.writeText and toggles visual state", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })

    render(<ShareButton />)
    const button = screen.getByRole("button", { name: /share/i })

    fireEvent.click(button)

    // Await the microtask / async copy state change to reflect in DOM
    const copiedText = await screen.findByText("Copied!")
    expect(copiedText).toBeInTheDocument()
    expect(writeTextMock).toHaveBeenCalledWith(mockHref)
  })

  it("reverts the visual state to 'Share' after 2000ms", async () => {
    // Enable fake timers specifically for this test
    vi.useFakeTimers()

    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })

    render(<ShareButton />)
    const button = screen.getByRole("button", { name: /share/i })

    fireEvent.click(button)

    // Let the async clipboard writeText promise resolve
    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText("Copied!")).toBeInTheDocument()

    // Advance timers by 2000ms to test the reset
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText("Share")).toBeInTheDocument()
  })

  it("falls back to document.execCommand('copy') when navigator.clipboard is unavailable", () => {
    // Make navigator.clipboard undefined
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
      writable: true,
    })

    const execCommandMock = vi.fn().mockReturnValue(true)
    document.execCommand = execCommandMock

    render(<ShareButton />)
    const button = screen.getByRole("button", { name: /share/i })

    fireEvent.click(button)

    expect(execCommandMock).toHaveBeenCalledWith("copy")
    expect(screen.getByText("Copied!")).toBeInTheDocument()
  })

  it("falls back to window.alert when clipboard APIs are completely blocked", () => {
    // Make navigator.clipboard undefined
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
      writable: true,
    })

    // Make execCommand throw or fail
    const execCommandMock = vi.fn().mockImplementation(() => {
      throw new Error("execCommand copy not supported")
    })
    document.execCommand = execCommandMock

    render(<ShareButton />)
    const button = screen.getByRole("button", { name: /share/i })

    fireEvent.click(button)

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining(mockHref)
    )
  })

  it("has print:hidden class to hide itself during printing", () => {
    render(<ShareButton />)
    const button = screen.getByRole("button", { name: /share/i })
    expect(button).toHaveClass("print:hidden")
  })
})
