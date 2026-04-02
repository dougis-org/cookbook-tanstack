import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useAutoSave } from "../useAutoSave"
import { useForm } from "react-hook-form"

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} },
    removeItem: (key: string) => { delete store[key] }
  }
})()
Object.defineProperty(window, "localStorage", { value: localStorageMock })

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should save to localStorage after debounce", async () => {
    const { result } = renderHook(() => {
      const form = useForm({ 
        defaultValues: { name: "" },
        mode: "onChange"
      })
      form.register("name", { required: true }) // Register field
      return {
        form,
        autoSave: useAutoSave({
          form,
          localStorageKey: "test-key",
          debounceMs: 1000
        })
      }
    })

    act(() => {
      result.current.form.setValue("name", "New Recipe", { shouldValidate: true })
    })

    // Should not save immediately
    expect(localStorage.getItem("test-key")).toBeNull()

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const savedData = JSON.parse(localStorage.getItem("test-key") || "{}")
    expect(savedData.name).toBe("New Recipe")
  })

  it("should trigger onSave mutation after debounce", async () => {
    const onSave = vi.fn().mockResolvedValue({})
    const { result } = renderHook(() => {
      const form = useForm({ 
        defaultValues: { name: "" },
        mode: "onChange"
      })
      form.register("name", { required: true }) // Register field
      return {
        form,
        autoSave: useAutoSave({
          form,
          onSave,
          localStorageKey: "test-key",
          debounceMs: 1000
        })
      }
    })

    await act(async () => {
      result.current.form.setValue("name", "New Recipe", { shouldValidate: true })
      await result.current.form.trigger()
    })

    expect(result.current.form.formState.isValid).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Wait for the async mutation in the hook to complete
    await act(async () => {
      // Use more cycles to ensure mutation finishes
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(onSave).toHaveBeenCalledWith({ name: "New Recipe" })
    expect(result.current.autoSave.status).toBe("saved")
  })

  it("should handle save errors", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Save failed"))
    const { result } = renderHook(() => {
      const form = useForm({ 
        defaultValues: { name: "" },
        mode: "onChange"
      })
      form.register("name", { required: true }) // Register field
      return {
        form,
        autoSave: useAutoSave({
          form,
          onSave,
          localStorageKey: "test-key",
          debounceMs: 1000
        })
      }
    })

    await act(async () => {
      result.current.form.setValue("name", "New Recipe", { shouldValidate: true })
      await result.current.form.trigger()
    })

    expect(result.current.form.formState.isValid).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Wait for the async mutation in the hook to fail
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.autoSave.status).toBe("error")
  })
})
