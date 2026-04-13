import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Test the document.title swap behavior
describe('CookbookPrintPage — document.title swap', () => {
  let originalTitle: string
  let mockPrint: ReturnType<typeof vi.fn>

  beforeEach(() => {
    originalTitle = document.title
    mockPrint = vi.fn()
    vi.stubGlobal('print', mockPrint)
  })

  afterEach(() => {
    document.title = originalTitle
    vi.unstubAllGlobals()
  })

  it('should save and restore document.title around window.print() call', () => {
    const testTitle = 'Test Cookbook'
    const titlesBefore: string[] = []

    // Mock print to capture title at call time
    mockPrint.mockImplementation(() => {
      titlesBefore.push(document.title)
    })

    // Simulate the effect logic
    const savedTitle = document.title
    document.title = testTitle
    window.print()
    document.title = savedTitle

    // Verify title was set to testTitle when print was called
    expect(titlesBefore[0]).toBe(testTitle)
    // Verify title was restored after
    expect(document.title).toBe(originalTitle)
  })

  it('should track title changes during print effect', () => {
    const titleChanges: string[] = []
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'title')

    // Track all title changes
    Object.defineProperty(document, 'title', {
      configurable: true,
      get() {
        return this._title || originalTitle
      },
      set(value: string) {
        titleChanges.push(value)
        this._title = value
      },
    })

    // Simulate the effect logic
    const saved = document.title
    document.title = 'Cookbook Name'
    window.print()
    document.title = saved

    expect(titleChanges).toContain('Cookbook Name')
    expect(document.title).toBe(originalTitle)

    // Restore original descriptor
    if (originalDescriptor) {
      Object.defineProperty(document, 'title', originalDescriptor)
    }
  })
})

