import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"
import { createRouterMock } from "./test-helpers/mocks"

// Required in production/dev (see .env.example); auth.ts fails fast without it.
// Not otherwise set in the test environment, so provide the same default here.
process.env.BETTER_AUTH_URL ??= "http://localhost:3000"

// Mock react-router globally for all unit tests to avoid duplicate mock declarations across test files
vi.mock("@tanstack/react-router", () => createRouterMock())

// Mock localStorage for jsdom if needed
if (typeof window !== "undefined") {
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value },
      clear: () => { store = {} },
      removeItem: (key: string) => { delete store[key] },
      length: 0,
      key: (index: number) => Object.keys(store)[index] || null
    }
  })()
  Object.defineProperty(window, "localStorage", { value: localStorageMock, configurable: true, writable: true })
}

afterEach(() => {
  cleanup()
  if (typeof window !== "undefined") {
    localStorage.clear()
  }
})
