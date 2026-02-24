/** Shared name/description/isPublic form fields used by both the create and edit forms. */

const inputClass =
  'w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent'

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
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="My Cookbook"
          maxLength={255}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea
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
          className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
        />
        <label htmlFor={checkboxId} className="text-sm text-gray-700 dark:text-gray-300">
          Public (visible to everyone)
        </label>
      </div>
    </>
  )
}
