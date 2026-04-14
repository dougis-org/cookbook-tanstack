interface FormErrorProps {
  message?: string
}

export default function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="bg-[color:var(--theme-error-bg)] border border-[color:var(--theme-error-border)] text-[var(--theme-error)] px-4 py-3 rounded-lg text-sm"
    >
      {message}
    </div>
  )
}
