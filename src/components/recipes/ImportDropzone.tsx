import { useRef, useState } from 'react'

interface ImportDropzoneProps {
  onFileSelected: (file: File) => void
}

export default function ImportDropzone({ onFileSelected }: ImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function isJsonFile(file: File): boolean {
    return file.name.toLowerCase().endsWith('.json')
  }

  function handleFile(file: File | undefined) {
    if (!file) return

    if (!isJsonFile(file)) {
      setError('Only .json files are allowed')
      return
    }

    setError(null)
    onFileSelected(file)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        aria-label="Import recipe JSON file"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.currentTarget.value = ''
        }}
        data-testid="import-file-input"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFile(e.dataTransfer.files?.[0])
        }}
        className="w-full border-2 border-dashed border-slate-600 rounded-xl p-10 text-left hover:border-cyan-500 transition-colors"
      >
        <p className="text-white text-lg font-semibold mb-1">Import recipe JSON</p>
        <p className="text-gray-400 text-sm">Drag and drop a .json file here, or click to browse.</p>
      </button>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  )
}
