import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { requireVerifiedAuth } from '@/lib/auth-guard'
import { useMutation } from '@tanstack/react-query'
import PageLayout from '@/components/layout/PageLayout'
import ImportDropzone from '@/components/recipes/ImportDropzone'
import { UrlImportInput } from '@/components/recipes/UrlImportInput'
import ImportPreviewModal from '@/components/recipes/ImportPreviewModal'
import TierWall from '@/components/ui/TierWall'
import { importedRecipeSchema, type ImportedRecipeInput } from '@/lib/validation'
import { RECIPE_EXPORT_VERSION } from '@/lib/export'
import { trpc } from '@/lib/trpc'
import { getTierWallReason, type TierWallReason } from '@/lib/trpc-error'
import { useTierEntitlements } from '@/hooks/useTierEntitlements'

export const Route = createFileRoute('/import/')({
  component: ImportPage,
  beforeLoad: requireVerifiedAuth(),
})

function ImportPage() {
  const navigate = useNavigate()
  const { canImport } = useTierEntitlements()
  const [fieldErrors, setFieldErrors] = useState<string[]>([])
  const [parsedRecipe, setParsedRecipe] = useState<ImportedRecipeInput | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [tierWallReason, setTierWallReason] = useState<TierWallReason | null>(null)

  const importMutation = useMutation(
    trpc.recipes.import.mutationOptions({
      onSuccess: (result) => {
        setParsedRecipe(null)
        setServerError(null)
        setUrlError(null)
        setTierWallReason(null)
        navigate({ to: '/recipes/$recipeId', params: { recipeId: result.id } })
      },
      onError: (error) => {
        const tierWall = getTierWallReason(error)
        if (tierWall) {
          setTierWallReason(tierWall)
          setServerError(null)
        } else {
          setServerError(error.message)
          setTierWallReason(null)
        }
      },
    }),
  )

  const importFromUrlMutation = useMutation(
    trpc.recipes.importFromUrl.mutationOptions({
      onSuccess: (result) => {
        setParsedRecipe(result)
        setUrlError(null)
        setServerError(null)
        setTierWallReason(null)
      },
      onError: (error) => {
        const tierWall = getTierWallReason(error)
        if (tierWall) {
          setTierWallReason(tierWall)
          setUrlError(null)
        } else {
          setUrlError(error.message)
          setTierWallReason(null)
        }
      },
    }),
  )

  async function handleUrlImport(url: string) {
    setUrlError(null)
    setServerError(null)
    setTierWallReason(null)
    setFieldErrors([])
    importFromUrlMutation.mutate({ url })
  }

  async function handleSelectedFile(file: File) {
    setFieldErrors([])
    setServerError(null)
    setUrlError(null)
    setTierWallReason(null)

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
    setUrlError(null)
    setTierWallReason(null)
  }

  function handleConfirm() {
    if (!parsedRecipe) return
    setServerError(null)
    setTierWallReason(null)
    importMutation.mutate(parsedRecipe)
  }

  const versionMismatch =
    parsedRecipe != null &&
    (parsedRecipe._version ?? RECIPE_EXPORT_VERSION) !== RECIPE_EXPORT_VERSION

  return (
    <PageLayout title="Import Recipe" description="Import a recipe from a URL or upload a JSON export.">
      <div className="max-w-2xl mx-auto space-y-6">
        {canImport ? (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[var(--theme-fg)]">Import from URL</h3>
              <UrlImportInput
                onSubmit={handleUrlImport}
                isPending={importFromUrlMutation.isPending}
                error={urlError}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--theme-border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--theme-bg)] text-[var(--theme-fg-subtle)]">or</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[var(--theme-fg)]">Import from File</h3>
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
          </>
        ) : (
          <TierWall reason="import" display="inline" />
        )}
      </div>

      {canImport && (
        <ImportPreviewModal
          open={parsedRecipe != null}
          recipe={parsedRecipe}
          versionMismatch={versionMismatch}
          error={serverError}
          isPending={importMutation.isPending}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      )}

      {canImport && tierWallReason && (
        <TierWall reason={tierWallReason} display="modal" onDismiss={() => setTierWallReason(null)} />
      )}
    </PageLayout>
  )
}
