import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ImportDropzone from '@/components/recipes/ImportDropzone'

describe('ImportDropzone', () => {
  it('rejects non-json files', () => {
    const onFileSelected = vi.fn()
    render(<ImportDropzone onFileSelected={onFileSelected} />)

    const input = screen.getByTestId('import-file-input') as HTMLInputElement
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelected).not.toHaveBeenCalled()
    expect(screen.getByText('Only .json files are allowed')).toBeInTheDocument()
  })

  it('accepts valid json files', () => {
    const onFileSelected = vi.fn()
    render(<ImportDropzone onFileSelected={onFileSelected} />)

    const input = screen.getByTestId('import-file-input') as HTMLInputElement
    const file = new File(['{"name":"Recipe"}'], 'recipe.json', { type: 'application/json' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelected).toHaveBeenCalledTimes(1)
    expect(onFileSelected).toHaveBeenCalledWith(file)
  })
})
