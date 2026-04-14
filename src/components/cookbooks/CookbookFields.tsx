/** Shared name/description/isPublic form fields used by both the create and edit forms. */

const inputClass =
  'w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg bg-[var(--theme-surface-raised)] text-[var(--theme-fg)] focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent'

interface CookbookFieldsProps {
  name: string
  description: string
  isPublic: boolean
  checkboxId: string
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onIsPublicChange: (v: boolean) => void
}

export default function CookbookFields({
  name,
  description,
  isPublic,
  checkboxId,
  onNameChange,
  onDescriptionChange,
  onIsPublicChange,
}: CookbookFieldsProps) {
  const nameId = `${checkboxId}-name`
  const descId = `${checkboxId}-desc`

  return (
    <>
      <div>
        <label htmlFor={nameId} className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-1">
          Name <span className="text-[var(--theme-error)]">*</span>
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="My Cookbook"
          maxLength={255}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={descId} className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-1">Description</label>
        <textarea
          id={descId}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Optional description"
          rows={2}
          maxLength={500}
          className={inputClass}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id={checkboxId}
          type="checkbox"
          checked={isPublic}
          onChange={(e) => onIsPublicChange(e.target.checked)}
          className="w-4 h-4 text-[var(--theme-accent)] bg-[var(--theme-surface-raised)] border-[var(--theme-border)] rounded focus:ring-[var(--theme-accent)]"
        />
        <label htmlFor={checkboxId} className="text-sm text-[var(--theme-fg-muted)]">
          Public (visible to everyone)
        </label>
      </div>
    </>
  )
}
