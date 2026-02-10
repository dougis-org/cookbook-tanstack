import { Loader2 } from "lucide-react"

interface FormSubmitButtonProps {
  isLoading: boolean
  label: string
  loadingLabel: string
}

export default function FormSubmitButton({ isLoading, label, loadingLabel }: FormSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading ? loadingLabel : label}
    </button>
  )
}
