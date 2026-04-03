import { useRef, useState } from 'react'

interface ImportDropzoneProps {
  onFileSelected: (file: File) => void
}

export default function ImportDropzone({ onFileSelected }: ImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  function handleDragEnter() {
    dragCounterRef.current++
    setIsDragging(true)
  }

  function handleDragLeave() {
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragging(false)
    handleFile(e.dataTransfer.files?.[0])
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

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-xl p-10 text-left transition-colors ${isDragging ? 'border-cyan-500' : 'border-slate-600 hover:border-cyan-500'}`}
      >
        <p className="text-white text-lg font-semibold mb-1">Import recipe JSON</p>
        <p className="text-gray-400 text-sm">Drag and drop a .json file here, or click to browse.</p>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  )
}
