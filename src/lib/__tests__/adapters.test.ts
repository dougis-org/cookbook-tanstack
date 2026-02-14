import { describe, it, expect } from "vitest"

describe("adapters", () => {
  it("module exists (placeholder after type-alignment refactor)", async () => {
    // The adapters module is intentionally empty after the type-alignment
    // refactor. DB column names are now used directly in components.
    const mod = await import("@/lib/adapters")
    expect(mod).toBeDefined()
  })
})
