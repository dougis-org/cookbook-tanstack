import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { requireAuth } from '@/lib/auth-guard'
import { useMutation } from '@tanstack/react-query'
import PageLayout from '@/components/layout/PageLayout'
import ImportDropzone from '@/components/recipes/ImportDropzone'
import ImportPreviewModal from '@/components/recipes/ImportPreviewModal'
import TierWall from '@/components/ui/TierWall'
import { importedRecipeSchema, type ImportedRecipeInput } from '@/lib/validation'
import { RECIPE_EXPORT_VERSION } from '@/lib/export'
import { trpc } from '@/lib/trpc'

export const Route = createFileRoute('/import/')({
  component: ImportPage,
  beforeLoad: requireAuth(),
})

function ImportPage() {
  const navigate = useNavigate()
  const [fieldErrors, setFieldErrors] = useState<string[]>([])
  const [parsedRecipe, setParsedRecipe] = useState<ImportedRecipeInput | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [tierWallReason, setTierWallReason] = useState<'count-limit' | 'private-content' | 'import' | null>(null)

  const importMutation = useMutation(
    trpc.recipes.import.mutationOptions({
      onSuccess: (result) => {
        setParsedRecipe(null)
        setServerError(null)
        navigate({ to: '/recipes/$recipeId', params: { recipeId: result.id } })
      },
      onError: (error) => {
        const appError = (error as { data?: { appError?: { type?: string; reason?: string } | null } })?.data?.appError
        if (appError?.type === 'tier-wall') {
          setTierWallReason(appError.reason as 'count-limit' | 'private-content' | 'import')
        } else {
          setServerError(error.message)
        }
      },
    }),
  )

  async function handleSelectedFile(file: File) {
    setFieldErrors([])
    setServerError(null)

    try {
      const content = await file.text()
      const parsed = JSON.parse(content)
      const validation = importedRecipeSchema.safeParse(parsed)

      if (!validation.success) {
        const errors = validation.error.issues.map((issue) => {
          const path = issue.path.join('.') || 'root'
          return `${path}: ${issue.message}`
        })
        setFieldErrors(errors)
        setParsedRecipe(null)
        return
      }

      setParsedRecipe(validation.data)
    } catch {
      setFieldErrors(['The selected file is not valid JSON'])
      setParsedRecipe(null)
    }
  }

  function handleCancel() {
    setParsedRecipe(null)
    setServerError(null)
  }

  function handleConfirm() {
    if (!parsedRecipe) return
    importMutation.mutate(parsedRecipe)
  }

  const versionMismatch =
    parsedRecipe != null &&
    (parsedRecipe._version ?? RECIPE_EXPORT_VERSION) !== RECIPE_EXPORT_VERSION

  return (
    <PageLayout title="Import Recipe" description="Upload a recipe JSON export and preview it before creating a new recipe.">
      <div className="max-w-2xl mx-auto space-y-4">
        <ImportDropzone onFileSelected={handleSelectedFile} />

        {fieldErrors.length > 0 && (
          <div className="rounded-lg border border-[color:var(--theme-error-border)] bg-[color:var(--theme-error-bg)] p-3">
            <p className="text-[var(--theme-error)] font-medium mb-2">Validation errors</p>
            <ul className="list-disc list-inside text-[var(--theme-error)] text-sm space-y-1">
              {fieldErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ImportPreviewModal
        open={parsedRecipe != null}
        recipe={parsedRecipe}
        versionMismatch={versionMismatch}
        error={serverError}
        isPending={importMutation.isPending}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />

      {tierWallReason && (
        <TierWall reason={tierWallReason} display="modal" onDismiss={() => setTierWallReason(null)} />
      )}
    </PageLayout>
  )
}
