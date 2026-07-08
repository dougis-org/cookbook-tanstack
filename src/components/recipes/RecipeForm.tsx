import { useCallback, useMemo, useRef, useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useRouter, useBlocker } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc"
import { getTierWallReason } from "@/lib/trpc-error"
import type { Recipe, TaxonomyItem } from "@/types/recipe"
import RecipeSourcePicker from "@/components/recipes/RecipeSourcePicker"
import CategoryPickerDropdown from "@/components/ui/CategoryPickerDropdown"
import { MultiSelectDropdown } from "@/components/ui/MultiSelectDropdown"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import ImageUploadField from "@/components/ui/ImageUploadField"
import { useAutoSave } from "@/hooks/useAutoSave"
import { useTierEntitlements } from "@/hooks/useTierEntitlements"
import TierWall from "@/components/ui/TierWall"
import StatusIndicator from "./StatusIndicator"
import { useAuth } from "@/hooks/useAuth"
import PostSubmitVerifyGate from "./PostSubmitVerifyGate"

function sortedEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const as = [...a].sort()
  const bs = [...b].sort()
  return as.every((v, i) => v === bs[i])
}

// skipcq: JS-0067 -- ES module scope function, not a global; see the default-export
// suppression note below for the same DeepSource false-positive rationale.
// null, undefined, and 0 are all "N/A" for prep/cook time (see openspec/changes/add-na-cook-prep-time).
function isTimeNA(value: number | null | undefined): boolean {
  return value === null || value === undefined || value === 0
}

const recipeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(500),
  classificationId: z.string().optional(),
  classificationName: z.string().optional(),
  ingredients: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  prepTimeNA: z.boolean(),
  cookTimeNA: z.boolean(),
  servings: z.string().optional(),
  difficulty: z.string().optional(),
  isPublic: z.boolean(),
  calories: z.string().optional(),
  fat: z.string().optional(),
  cholesterol: z.string().optional(),
  sodium: z.string().optional(),
  protein: z.string().optional(),
})

type RecipeFormValues = z.infer<typeof recipeFormSchema>
type Difficulty = "easy" | "medium" | "hard"
const validDifficulties: Difficulty[] = ["easy", "medium", "hard"]

function toDifficulty(value: string | undefined): Difficulty | undefined {
  return validDifficulties.includes(value as Difficulty) ? (value as Difficulty) : undefined
}

interface RecipeWithRelations extends Recipe {
  meals?: TaxonomyItem[]
  courses?: TaxonomyItem[]
  preparations?: TaxonomyItem[]
  sourceName?: string | null
  classificationName?: string | null
}

// ─── RecipeForm ───────────────────────────────────────────────────────────────

interface RecipeFormProps {
  initialData?: RecipeWithRelations
}

// skipcq: JS-0067 -- ES module default export, not a global scope function; DeepSource's
// global-scope check misidentifies module-scoped exports. Same suppression rationale as
// src/e2e/helpers/recipes.ts and src/e2e/personal-source-privacy.spec.ts (JS-0067).
export default function RecipeForm({ initialData }: RecipeFormProps) {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = !!initialData
  const { canCreatePrivate } = useTierEntitlements()

  const [selectedMealIds, setSelectedMealIds] = useState<string[]>(
    initialData?.meals?.map((m) => m.id) ?? [],
  )
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    initialData?.courses?.map((c) => c.id) ?? [],
  )
  const [selectedPrepIds, setSelectedPrepIds] = useState<string[]>(
    initialData?.preparations?.map((p) => p.id) ?? [],
  )
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    initialData?.sourceId ?? "",
  )
  const [personalSourceName, setPersonalSourceName] = useState<string>(
    initialData?.personalSourceName ?? "",
  )
  const [pendingUpload, setPendingUpload] = useState<{
    fileId: string
    url: string
  } | null>(null)
  const pendingUploadRef = useRef(pendingUpload)
  pendingUploadRef.current = pendingUpload

  const initialMealIds = useMemo(() => initialData?.meals?.map((m) => m.id) ?? [], [initialData?.meals])
  const initialCourseIds = useMemo(() => initialData?.courses?.map((c) => c.id) ?? [], [initialData?.courses])
  const initialPrepIds = useMemo(() => initialData?.preparations?.map((p) => p.id) ?? [], [initialData?.preparations])
  const initialSourceId = useMemo(() => initialData?.sourceId ?? "", [initialData?.sourceId])
  const initialPersonalSourceName = useMemo(() => initialData?.personalSourceName ?? "", [initialData?.personalSourceName])

  const { data: allMeals } = useQuery(trpc.meals.list.queryOptions())
  const { data: allCourses } = useQuery(trpc.courses.list.queryOptions())
  const { data: allPreparations } = useQuery(trpc.preparations.list.queryOptions())

  const originalDataRef = useRef(initialData)
  // skipcq: JS-R1005 -- flat field-by-field default mapping, not branching control flow;
  // each `??`/ternary maps one independent form field and cannot be meaningfully split.
  const formDefaults = useMemo(() => ({
    name: originalDataRef.current?.name ?? "",
    classificationId: originalDataRef.current?.classificationId ?? "",
    classificationName: originalDataRef.current?.classificationName ?? "",
    ingredients: originalDataRef.current?.ingredients ?? "",
    imageUrl: originalDataRef.current?.imageUrl ?? undefined,
    instructions: originalDataRef.current?.instructions ?? "",
    notes: originalDataRef.current?.notes ?? "",
    prepTime: isTimeNA(originalDataRef.current?.prepTime) ? "" : originalDataRef.current?.prepTime?.toString() ?? "",
    cookTime: isTimeNA(originalDataRef.current?.cookTime) ? "" : originalDataRef.current?.cookTime?.toString() ?? "",
    prepTimeNA: Boolean(originalDataRef.current) && isTimeNA(originalDataRef.current?.prepTime),
    cookTimeNA: Boolean(originalDataRef.current) && isTimeNA(originalDataRef.current?.cookTime),
    servings: originalDataRef.current?.servings?.toString() ?? "",
    difficulty: originalDataRef.current?.difficulty ?? "",
    isPublic: originalDataRef.current?.isPublic ?? true,
    calories: originalDataRef.current?.calories?.toString() ?? "",
    fat: originalDataRef.current?.fat?.toString() ?? "",
    cholesterol: originalDataRef.current?.cholesterol?.toString() ?? "",
    sodium: originalDataRef.current?.sodium?.toString() ?? "",
    protein: originalDataRef.current?.protein?.toString() ?? "",
  }), [])

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      ...formDefaults,
      isPublic: !canCreatePrivate && !isEdit ? true : formDefaults.isPublic,
    },
    mode: "onChange",
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = form

  const createMutation = useMutation(trpc.recipes.create.mutationOptions())
  const updateMutation = useMutation(trpc.recipes.update.mutationOptions())
  // Autosave uses networkMode:'always' so an offline request fails immediately
  // instead of TanStack Query pausing it indefinitely (default 'online' mode).
  const autoSaveMutation = useMutation({ ...trpc.recipes.update.mutationOptions(), networkMode: 'always' })
  const isPending = createMutation.isPending || updateMutation.isPending
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [tierWallReason, setTierWallReason] = useState<'count-limit' | 'private-content' | 'import' | null>(null)
  const [pendingGate, setPendingGate] = useState<{ id: string; name: string } | null>(null)
  const { session } = useAuth()

  function toNum(v: string | undefined): number | undefined {
    if (v == null) return undefined
    if (v.trim() === "") return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }

  // skipcq: JS-R1005 -- flat field-by-field payload mapping, not branching control flow;
  // each `||`/ternary maps one independent form field and cannot be meaningfully split.
  const toPayload = useCallback((values: RecipeFormValues) => {
    return {
      name: values.name,
      classificationId: values.classificationId || undefined,
      sourceId: selectedSourceId || undefined,
      personalSourceName: personalSourceName || null,
      ingredients: values.ingredients || undefined,
      imageUrl: values.imageUrl === null ? null : values.imageUrl || undefined,
      instructions: values.instructions || undefined,
      notes: values.notes || undefined,
      prepTime: values.prepTimeNA ? null : toNum(values.prepTime),
      cookTime: values.cookTimeNA ? null : toNum(values.cookTime),
      servings: toNum(values.servings),
      difficulty: toDifficulty(values.difficulty),
      isPublic: values.isPublic,
      calories: toNum(values.calories),
      fat: toNum(values.fat),
      cholesterol: toNum(values.cholesterol),
      sodium: toNum(values.sodium),
      protein: toNum(values.protein),
    }
  }, [selectedSourceId, personalSourceName])

  const autoSaveOnSave = useCallback(async (values: RecipeFormValues) => {
    if (isEdit && initialData?.id) {
      const payload = toPayload(values)
      const taxonomyIds = {
        mealIds: selectedMealIds.length ? selectedMealIds : undefined,
        courseIds: selectedCourseIds.length ? selectedCourseIds : undefined,
        preparationIds: selectedPrepIds.length ? selectedPrepIds : undefined,
      }
      await autoSaveMutation.mutateAsync({ id: initialData.id, ...payload, ...taxonomyIds })
    }
  }, [isEdit, initialData?.id, toPayload, selectedMealIds, selectedCourseIds, selectedPrepIds, autoSaveMutation])

  const localStorageKey = useMemo(() => isEdit ? `recipe-draft-${initialData?.id}` : "recipe-draft-new", [isEdit, initialData?.id])
  const { status: autoSaveStatus, savedToServer, draft, purgeDraft, resetStatus, retry: retryAutoSave } = useAutoSave({
    form,
    onSave: isEdit ? autoSaveOnSave : undefined,
    localStorageKey,
    debounceMs: 1000,
  })

  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  useEffect(() => {
    if (!draft || Object.keys(draft).length === 0) {
      setShowDraftPrompt(false)
      return
    }
    // Only prompt if the draft differs from the current (initial) form values
    const currentValues = form.getValues()
    const hasDifferences = Object.keys(draft).some((key) => {
      const draftVal = (draft as Record<string, unknown>)[key]
      const formVal = (currentValues as Record<string, unknown>)[key]
      return JSON.stringify(draftVal) !== JSON.stringify(formVal)
    })
    setShowDraftPrompt(hasDifferences)
  }, [draft, form])

  const handleRestoreDraft = () => {
    if (draft) {
      // prepTimeNA/cookTimeNA are registered RHF fields, so the draft
      // snapshot already captured them — reset restores the toggle state
      // exactly as it was, with no need to re-derive it from other fields.
      reset(draft)
      setShowDraftPrompt(false)
    }
  }

  const hasExternalChanges =
    !sortedEqual(selectedMealIds, initialMealIds) ||
    !sortedEqual(selectedCourseIds, initialCourseIds) ||
    !sortedEqual(selectedPrepIds, initialPrepIds) ||
    selectedSourceId !== initialSourceId ||
    personalSourceName !== initialPersonalSourceName

  const isFormDirty = isDirty || hasExternalChanges
  const isFormDirtyRef = useRef(false)
  isFormDirtyRef.current = isFormDirty

  const savedToServerRef = useRef(savedToServer)
  savedToServerRef.current = savedToServer

  const blocker = useBlocker({
    shouldBlockFn: useCallback(() => {
      if (isEdit) {
        // In Edit mode, suppress guard if latest changes were successfully autosaved
        return isFormDirtyRef.current && !savedToServerRef.current
      }
      return isFormDirtyRef.current
    }, [isEdit]),
    enableBeforeUnload: true,
    withResolver: true,
  })

  const clearPendingUploadState = useCallback(() => {
    pendingUploadRef.current = null
    setPendingUpload(null)
  }, [])

  const afterSaveSuccess = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [["recipes"]] })
    purgeDraft()
    clearPendingUploadState()
    isFormDirtyRef.current = false
  }, [queryClient, purgeDraft, clearPendingUploadState])

  const cleanupPendingUpload = useCallback(() => {
    const upload = pendingUploadRef.current

    if (!upload) {
      return
    }

    clearPendingUploadState()
    void fetch(`/api/upload/${upload.fileId}`, { method: "DELETE", keepalive: true })
  }, [clearPendingUploadState])

  const handleDiscardChanges = useCallback(() => {
    cleanupPendingUpload()
    blocker.proceed?.()
  }, [blocker, cleanupPendingUpload])

  function handleCancel() {
    if (window.history.length > 1) {
      router.history.back()
    } else {
      navigate({ to: "/recipes" })
    }
  }

  async function onSubmit(values: RecipeFormValues) {
    setSubmitError(null)
    setTierWallReason(null)
    const payload = toPayload(values)
    const taxonomyIds = {
      mealIds: selectedMealIds.length ? selectedMealIds : undefined,
      courseIds: selectedCourseIds.length ? selectedCourseIds : undefined,
      preparationIds: selectedPrepIds.length ? selectedPrepIds : undefined,
    }

    try {
      if (isEdit && initialData?.id) {
        await updateMutation.mutateAsync({ id: initialData.id, ...payload, ...taxonomyIds })
        await afterSaveSuccess()
        navigate({ to: "/recipes/$recipeId", params: { recipeId: initialData.id } })
      } else {
        const created = await createMutation.mutateAsync({
          ...payload,
          ...taxonomyIds,
        })
        await afterSaveSuccess()
        if (created.pendingVerification) {
          setPendingGate({ id: created.id, name: created.name as string })
        } else {
          navigate({ to: "/recipes/$recipeId", params: { recipeId: created.id } })
        }
      }
    } catch (error) {
      const tierWall = getTierWallReason(error)
      if (tierWall) {
        setTierWallReason(tierWall)
        setSubmitError(null)
      } else {
        setSubmitError(error instanceof Error ? error.message : "Failed to save recipe. Please try again.")
        setTierWallReason(null)
      }
    }
  }

  function handleRevert() {
    cleanupPendingUpload()
    reset(formDefaults, { keepDirty: false })
    setSelectedMealIds(initialMealIds)
    setSelectedCourseIds(initialCourseIds)
    setSelectedPrepIds(initialPrepIds)
    setSelectedSourceId(initialSourceId)
    setPersonalSourceName(initialPersonalSourceName)
    purgeDraft()
    resetStatus()
  }

  if (pendingGate) {
    return (
      <PostSubmitVerifyGate
        recipeId={pendingGate.id}
        recipeName={pendingGate.name}
        email={session?.user?.email}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {showDraftPrompt && (
        <div className="mb-6 p-4 bg-[color:var(--theme-accent-subtle-bg)] border border-[color:var(--theme-accent-subtle-border)] rounded-lg flex items-center justify-between">
          <div className="text-[var(--theme-accent-subtle-text)]">
            <span className="font-semibold">You have an unsaved draft.</span> Would you like to restore it?
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRestoreDraft}
              className="px-4 py-1 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white text-sm font-semibold rounded transition-colors"
            >
              Restore
            </button>
            <button
              onClick={() => {
                purgeDraft()
                setShowDraftPrompt(false)
              }}
              className="px-4 py-1 bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] text-sm font-semibold rounded transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="bg-[var(--theme-surface)] rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-[var(--theme-fg)]">
            {isEdit ? "Edit Recipe" : "Create New Recipe"}
          </h2>
          <StatusIndicator status={autoSaveStatus} onRetry={isEdit ? retryAutoSave : undefined} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Recipe Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
              Recipe Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter recipe name"
              spellCheck
              {...register("name")}
              className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-surface-raised)] text-[var(--theme-fg)]"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-[var(--theme-error)]">{errors.name.message}</p>
            )}
          </div>

          {/* Recipe Image */}
          <div>
            <label className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
              Recipe Image
            </label>
            <ImageUploadField
              value={watch("imageUrl") ?? null}
              initialUrl={initialData?.imageUrl ?? null}
              onUpload={(url, fileId) => {
                setValue("imageUrl", url, { shouldDirty: true })
                setPendingUpload({ fileId, url })
              }}
              onRemove={() => {
                setValue("imageUrl", null, { shouldDirty: true })
                setPendingUpload(null)
              }}
            />
          </div>

          {/* Classification */}
          <div>
            <label htmlFor="classificationId" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
              Category
            </label>
            <CategoryPickerDropdown
              id="classificationId"
              value={watch("classificationId") || ""}
              selectedName={watch("classificationName") || ""}
              onChange={(id, name) => {
                setValue("classificationId", id, { shouldDirty: true })
                setValue("classificationName", name, { shouldDirty: true })
              }}
              placeholder="Select a category"
            />
          </div>

          {/* Source */}
          <div>
            <label htmlFor="sourceId" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
              Source (cookbook, website, etc.)
            </label>
            <RecipeSourcePicker
              id="sourceId"
              value={selectedSourceId}
              initialName={initialData?.sourceName ?? ""}
              onChange={setSelectedSourceId}
              personalSourceName={personalSourceName}
              onPersonalSourceNameChange={setPersonalSourceName}
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Add notes about this recipe"
              spellCheck
              {...register("notes")}
              className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
            />
          </div>

          {/* Timings & Servings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="prepTime" className="block text-sm font-medium text-[var(--theme-fg-muted)]">
                  Prep Time (minutes)
                </label>
                <label htmlFor="prepTimeNA" className="flex items-center gap-1 text-xs font-medium text-[var(--theme-fg-muted)]">
                  <input
                    id="prepTimeNA"
                    type="checkbox"
                    checked={watch("prepTimeNA")}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setValue("prepTimeNA", checked, { shouldDirty: true })
                      if (checked) setValue("prepTime", "", { shouldDirty: true })
                    }}
                    className="w-4 h-4 text-[var(--theme-accent)] bg-[var(--theme-surface-hover)] border-[var(--theme-border)] rounded focus:ring-[var(--theme-accent)]"
                  />
                  N/A
                </label>
              </div>
              <input
                id="prepTime"
                type="number"
                placeholder="30"
                disabled={watch("prepTimeNA")}
                {...register("prepTime")}
                className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)] disabled:opacity-50"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="cookTime" className="block text-sm font-medium text-[var(--theme-fg-muted)]">
                  Cook Time (minutes)
                </label>
                <label htmlFor="cookTimeNA" className="flex items-center gap-1 text-xs font-medium text-[var(--theme-fg-muted)]">
                  <input
                    id="cookTimeNA"
                    type="checkbox"
                    checked={watch("cookTimeNA")}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setValue("cookTimeNA", checked, { shouldDirty: true })
                      if (checked) setValue("cookTime", "", { shouldDirty: true })
                    }}
                    className="w-4 h-4 text-[var(--theme-accent)] bg-[var(--theme-surface-hover)] border-[var(--theme-border)] rounded focus:ring-[var(--theme-accent)]"
                  />
                  N/A
                </label>
              </div>
              <input
                id="cookTime"
                type="number"
                placeholder="45"
                disabled={watch("cookTimeNA")}
                {...register("cookTime")}
                className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)] disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="servings" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
                Servings
              </label>
              <input
                id="servings"
                type="number"
                placeholder="4"
                {...register("servings")}
                className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
              Difficulty
            </label>
            <select
              id="difficulty"
              {...register("difficulty")}
              className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
            >
              <option value="">Select difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Taxonomy selectors */}
          <div className="flex flex-wrap gap-2">
            <MultiSelectDropdown
              options={allMeals ?? []}
              selectedIds={selectedMealIds}
              onChange={setSelectedMealIds}
              placeholder="All Meals"
              label="meal"
            />
            <MultiSelectDropdown
              options={allCourses ?? []}
              selectedIds={selectedCourseIds}
              onChange={setSelectedCourseIds}
              placeholder="All Courses"
              label="course"
            />
            <MultiSelectDropdown
              options={allPreparations ?? []}
              selectedIds={selectedPrepIds}
              onChange={setSelectedPrepIds}
              placeholder="All Preparations"
              label="preparation"
            />
          </div>

          {/* Public toggle */}
          {(canCreatePrivate || (isEdit && !watch('isPublic'))) && (
            <div className="flex items-center gap-3">
              <input
                id="isPublic"
                type="checkbox"
                {...register("isPublic")}
                className="w-4 h-4 text-[var(--theme-accent)] bg-[var(--theme-surface-hover)] border-[var(--theme-border)] rounded focus:ring-[var(--theme-accent)]"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-[var(--theme-fg-muted)]">
                Public recipe (visible to everyone)
              </label>
            </div>
          )}
          {!canCreatePrivate && watch('isPublic') && !isEdit && (
            <p className="text-sm text-[var(--theme-fg-muted)] italic">
              New recipes are public on your current plan.
            </p>
          )}

          {/* Ingredients */}
          <div>
            <label htmlFor="ingredients" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
              Ingredients
            </label>
            <textarea
              id="ingredients"
              rows={8}
              placeholder="Enter ingredients, one per line"
              spellCheck
              {...register("ingredients")}
              className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)] font-mono text-sm"
            />
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
              Instructions
            </label>
            <textarea
              id="instructions"
              rows={8}
              placeholder="Enter instructions, one step per line"
              spellCheck
              {...register("instructions")}
              className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)] font-mono text-sm"
            />
          </div>

          {/* Nutrition */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--theme-fg)] mb-3">Nutrition (per serving)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label htmlFor="calories" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
                  Calories
                </label>
                <input
                  id="calories"
                  type="number"
                  placeholder="0"
                  {...register("calories")}
                  className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
                />
              </div>
              <div>
                <label htmlFor="fat" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
                  Fat (g)
                </label>
                <input
                  id="fat"
                  type="number"
                  placeholder="0"
                  {...register("fat")}
                  className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
                />
              </div>
              <div>
                <label htmlFor="cholesterol" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
                  Cholesterol (mg)
                </label>
                <input
                  id="cholesterol"
                  type="number"
                  placeholder="0"
                  {...register("cholesterol")}
                  className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
                />
              </div>
              <div>
                <label htmlFor="sodium" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
                  Sodium (mg)
                </label>
                <input
                  id="sodium"
                  type="number"
                  placeholder="0"
                  {...register("sodium")}
                  className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
                />
              </div>
              <div>
                <label htmlFor="protein" className="block text-sm font-medium text-[var(--theme-fg-muted)] mb-2">
                  Protein (g)
                </label>
                <input
                  id="protein"
                  type="number"
                  placeholder="0"
                  {...register("protein")}
                  className="w-full px-4 py-2 border border-[var(--theme-border)] rounded-lg focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent bg-[var(--theme-bg)] text-[var(--theme-fg)]"
                />
              </div>
            </div>
          </div>

          {submitError && (
            <div className="p-4 bg-[color:var(--theme-error-bg)] border border-[color:var(--theme-error-border)] rounded-lg text-[var(--theme-error)]">
              {submitError}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Update Recipe"
                  : "Create Recipe"}
            </button>
            <button
              type="button"
              onClick={isEdit ? handleRevert : handleCancel}
              className="px-6 py-2 bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] font-semibold rounded-lg transition-colors"
            >
              {isEdit ? "Revert" : "Cancel"}
            </button>
          </div>
        </form>
      </div>

      {blocker.status === "blocked" && (
        <ConfirmDialog
          message="You have unsaved changes. Are you sure you want to leave?"
          onConfirm={handleDiscardChanges}
          onCancel={blocker.reset}
        />
      )}

      {tierWallReason && (
        <TierWall reason={tierWallReason} display="modal" onDismiss={() => setTierWallReason(null)} />
      )}
    </div>
  )
}
