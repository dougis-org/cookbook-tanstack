export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email is required"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email"
}

export function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required"
  if (password.length < 8) return "Password must be at least 8 characters"
}

export function validateUsername(username: string): string | undefined {
  if (!username.trim()) return "Username is required"
  if (username.length < 3) return "Username must be at least 3 characters"
}
