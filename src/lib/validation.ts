export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim()
  if (!trimmed) return "Email is required"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Please enter a valid email"
}

export function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required"
  if (password.length < 8) return "Password must be at least 8 characters"
}

export function validateUsername(username: string): string | undefined {
  const trimmed = username.trim()
  if (!trimmed) return "Username is required"
  if (trimmed.length < 3) return "Username must be at least 3 characters"
}
