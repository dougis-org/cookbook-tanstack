import { describe, it, expect } from "vitest"
import { toRecipeProps } from "@/lib/adapters"

describe("toRecipeProps", () => {
  it("maps name to title while preserving all other fields", () => {
    const recipe = { id: "1", name: "Pasta", imageUrl: "http://example.com/img.jpg" }
    const result = toRecipeProps(recipe)

    expect(result.title).toBe("Pasta")
    expect(result.name).toBe("Pasta")
    expect(result.id).toBe("1")
    expect(result.imageUrl).toBe("http://example.com/img.jpg")
  })
})
