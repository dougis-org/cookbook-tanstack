import { vi } from "vitest"

export const TEST_USER = {
  id: "user-1",
  email: "cook@example.com",
  name: "Test User",
  username: "testuser",
}

export const unverifiedAuth = {
  session: {
    user: {
      ...TEST_USER,
      emailVerified: false,
    },
  },
  isPending: false,
  isLoggedIn: true,
  userId: TEST_USER.id,
}

export const verifiedAuth = {
  ...unverifiedAuth,
  session: {
    user: {
      ...unverifiedAuth.session.user,
      emailVerified: true,
    },
  },
}

export const loggedOutAuth = {
  session: null,
  isPending: false,
  isLoggedIn: false,
  userId: null,
}

export const mockSendVerificationEmail = vi.fn().mockResolvedValue({})
export const mockSignUpEmail = vi.fn().mockResolvedValue({})
export const mockSignInEmail = vi.fn().mockResolvedValue({})
export const mockResetPassword = vi.fn().mockResolvedValue({})

export const mockAuthClient = {
  sendVerificationEmail: mockSendVerificationEmail,
  signUp: {
    email: mockSignUpEmail,
  },
  signIn: {
    email: mockSignInEmail,
  },
  resetPassword: mockResetPassword,
}

export function setupAuthCallbacks(mockFn: ReturnType<typeof vi.fn>, type: "success" | "error", value?: unknown) {
  mockFn.mockImplementation((_data: unknown, callbacks: {
    onSuccess?: (value: unknown) => void
    onError?: (ctx: { error: { message: unknown } }) => void
  }) => {
    if (type === "success") {
      callbacks.onSuccess?.(value ?? {})
    } else {
      callbacks.onError?.({ error: { message: value ?? "Error" } })
    }
    return Promise.resolve(value ?? {})
  })
}
