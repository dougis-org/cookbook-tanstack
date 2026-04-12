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

  it('clears input value after selecting a file so same file can be selected again', () => {
    const onFileSelected = vi.fn()
    render(<ImportDropzone onFileSelected={onFileSelected} />)

    const input = screen.getByTestId('import-file-input') as HTMLInputElement
    const file = new File(['{"name":"Recipe"}'], 'recipe.json', { type: 'application/json' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(onFileSelected).toHaveBeenCalledWith(file)
    expect(input.value).toBe('')

    fireEvent.change(input, { target: { files: [file] } })
    expect(onFileSelected).toHaveBeenCalledTimes(2)
  })

  describe('semantic element', () => {
    it('drop zone is NOT a button element', () => {
      render(<ImportDropzone onFileSelected={vi.fn()} />)
      const dropZone = screen.getByRole('button', { name: /import recipe json/i })
      expect(dropZone.tagName).not.toBe('BUTTON')
    })

    it('drop zone has role="button"', () => {
      render(<ImportDropzone onFileSelected={vi.fn()} />)
      const dropZone = screen.getByRole('button', { name: /import recipe json/i })
      expect(dropZone).toHaveAttribute('role', 'button')
    })

    it('drop zone has tabIndex={0}', () => {
      render(<ImportDropzone onFileSelected={vi.fn()} />)
      const dropZone = screen.getByRole('button', { name: /import recipe json/i })
      expect(dropZone).toHaveAttribute('tabindex', '0')
    })
  })

  describe('keyboard activation', () => {
    it('Enter key triggers file input click', () => {
      render(<ImportDropzone onFileSelected={vi.fn()} />)
      const input = screen.getByTestId('import-file-input') as HTMLInputElement
      const clickSpy = vi.spyOn(input, 'click')
      const dropZone = screen.getByRole('button', { name: /import recipe json/i })

      fireEvent.keyDown(dropZone, { key: 'Enter' })

      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('Space key triggers file input click', () => {
      render(<ImportDropzone onFileSelected={vi.fn()} />)
      const input = screen.getByTestId('import-file-input') as HTMLInputElement
      const clickSpy = vi.spyOn(input, 'click')
      const dropZone = screen.getByRole('button', { name: /import recipe json/i })

      fireEvent.keyDown(dropZone, { key: ' ' })

      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('other keys do not trigger file input click', () => {
      render(<ImportDropzone onFileSelected={vi.fn()} />)
      const input = screen.getByTestId('import-file-input') as HTMLInputElement
      const clickSpy = vi.spyOn(input, 'click')
      const dropZone = screen.getByRole('button', { name: /import recipe json/i })

      fireEvent.keyDown(dropZone, { key: 'Tab' })
      fireEvent.keyDown(dropZone, { key: 'Escape' })
      fireEvent.keyDown(dropZone, { key: 'a' })

      expect(clickSpy).not.toHaveBeenCalled()
    })
  })

  describe('drag-over visual feedback', () => {
    function getClasses(el: HTMLElement) {
      return el.className.split(' ')
    }

    it('border is border-[var(--theme-border)] initially (no drag)', () => {
      render(<ImportDropzone onFileSelected={vi.fn()} />)
      const dropZone = screen.getByRole('button', { name: /import recipe json/i })
      expect(dropZone.className).toContain('border-[var(--theme-border)]')
      // Active drag class is the bare (non-hover-prefixed) accent border
      expect(getClasses(dropZone)).not.toContain('border-[var(--theme-accent)]')
    })

    it('border changes to border-[var(--theme-accent)] when dragging over', () => {
      render(<ImportDropzone onFileSelected={vi.fn()} />)
      const dropZone = screen.getByRole('button', { name: /import recipe json/i })

      fireEvent.dragEnter(dropZone)

      expect(dropZone.className).toContain('border-[var(--theme-accent)]')
      expect(dropZone.className).not.toContain('border-[var(--theme-border)]')
    })

    it('border returns to border-[var(--theme-border)] after drag leaves', () => {
      render(<ImportDropzone onFileSelected={vi.fn()} />)
      const dropZone = screen.getByRole('button', { name: /import recipe json/i })

      fireEvent.dragEnter(dropZone)
      fireEvent.dragLeave(dropZone)

      expect(dropZone.className).toContain('border-[var(--theme-border)]')
      expect(getClasses(dropZone)).not.toContain('border-[var(--theme-accent)]')
    })

    it('border returns to border-[var(--theme-border)] after drop', () => {
      const onFileSelected = vi.fn()
      render(<ImportDropzone onFileSelected={onFileSelected} />)
      const dropZone = screen.getByRole('button', { name: /import recipe json/i })
      const file = new File(['{"name":"Recipe"}'], 'recipe.json', { type: 'application/json' })

      fireEvent.dragEnter(dropZone)
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } })

      expect(dropZone.className).toContain('border-[var(--theme-border)]')
      expect(getClasses(dropZone)).not.toContain('border-[var(--theme-accent)]')
    })

    it('border stays accent when pointer moves between child elements (no flicker)', () => {
      render(<ImportDropzone onFileSelected={vi.fn()} />)
      const dropZone = screen.getByRole('button', { name: /import recipe json/i })
      const childEl = dropZone.querySelector('p')!

      // Enter zone, then enter child (fires dragleave on zone root then dragenter on child)
      fireEvent.dragEnter(dropZone)
      fireEvent.dragEnter(childEl)
      fireEvent.dragLeave(dropZone)

      // Counter is still 1 (entered twice, left once) — should stay active
      expect(dropZone.className).toContain('border-[var(--theme-accent)]')
    })
  })
})
