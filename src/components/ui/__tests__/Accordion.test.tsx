import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Accordion from "../Accordion"

const items = [
  { id: "one", title: "Section One", content: <p>Content one</p> },
  { id: "two", title: "Section Two", content: <p>Content two</p> },
  { id: "three", title: "Section Three", content: <p>Content three</p> },
]

describe("Accordion", () => {
  it("renders every item's title from the items prop", () => {
    render(<Accordion items={items} />)
    expect(screen.getByText("Section One")).toBeInTheDocument()
    expect(screen.getByText("Section Two")).toBeInTheDocument()
    expect(screen.getByText("Section Three")).toBeInTheDocument()
  })

  it("renders every item's content", () => {
    render(<Accordion items={items} />)
    expect(screen.getByText("Content one")).toBeInTheDocument()
    expect(screen.getByText("Content two")).toBeInTheDocument()
    expect(screen.getByText("Content three")).toBeInTheDocument()
  })

  it("all sections are collapsed by default when no defaultOpenId is given", () => {
    render(<Accordion items={items} />)
    const details = screen.getAllByRole("group") as HTMLDetailsElement[]
    details.forEach((detail) => expect(detail).not.toHaveAttribute("open"))
  })

  it("opens the section matching defaultOpenId on initial render and collapses the rest", () => {
    render(<Accordion items={items} defaultOpenId="two" />)
    const details = screen.getAllByRole("group") as HTMLDetailsElement[]
    expect(details[0]).not.toHaveAttribute("open")
    expect(details[1]).toHaveAttribute("open")
    expect(details[2]).not.toHaveAttribute("open")
  })

  it("toggles a section independently of the others when its summary is clicked", async () => {
    const user = userEvent.setup()
    const { container } = render(<Accordion items={items} />)
    const summaries = container.querySelectorAll("summary")

    await user.click(summaries[0])

    const details = screen.getAllByRole("group") as HTMLDetailsElement[]
    expect(details[0]).toHaveAttribute("open")
    expect(details[1]).not.toHaveAttribute("open")
    expect(details[2]).not.toHaveAttribute("open")
  })

  it("relies on native <details>/<summary> keyboard activation rather than custom key handlers", () => {
    // jsdom doesn't emulate the browser's built-in keydown-to-click activation for
    // <summary> (that's UA default-action behavior, not part of the DOM spec), so
    // Enter/Space toggling can't be simulated here. Instead we assert the component
    // hasn't overridden native focusability (no explicit tabindex) — a DOM attribute
    // check, not a React-listener check, since React attaches onKeyDown via
    // addEventListener rather than an inline attribute. Real Enter/Space toggling is
    // verified manually per task 1.3.
    const { container } = render(<Accordion items={items} />)
    const summaries = container.querySelectorAll<HTMLElement>("summary")
    summaries.forEach((summary) => {
      expect(summary.getAttribute("tabindex")).toBeNull()
    })
  })

  it("keeps a section open after an unrelated re-render (regression: controlled `open` must not snap shut)", async () => {
    const user = userEvent.setup()
    const { container, rerender } = render(<Accordion items={items} />)
    const summaries = container.querySelectorAll("summary")

    await user.click(summaries[0])
    rerender(<Accordion items={items} />)

    const details = screen.getAllByRole("group") as HTMLDetailsElement[]
    expect(details[0]).toHaveAttribute("open")
  })

  it("uses native <details>/<summary> elements", () => {
    const { container } = render(<Accordion items={items} />)
    expect(container.querySelectorAll("details")).toHaveLength(3)
    expect(container.querySelectorAll("summary")).toHaveLength(3)
  })
})
