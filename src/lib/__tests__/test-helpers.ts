import { vi } from "vitest"

export function mockAuthError(mockFn: ReturnType<typeof vi.fn>, message: string) {
  mockFn.mockImplementation(
    (_data: unknown, callbacks: { onError: (ctx: { error: { message: string } }) => void }) => {
      callbacks.onError({ error: { message } })
    },
  )
}
