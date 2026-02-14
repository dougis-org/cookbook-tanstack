import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { trpc } from "@/lib/trpc"
import type { Recipe } from "@/types/recipe"

const recipeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(500),
  classificationId: z.string().optional(),
  ingredients: z.string().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
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

interface RecipeWithRelations extends Recipe {
  meals?: { recipeId: string; mealId: string }[]
  courses?: { recipeId: string; courseId: string }[]
  preparations?: { recipeId: string; preparationId: string }[]
}

interface RecipeFormProps {
  initialData?: RecipeWithRelations
}

export default function RecipeForm({ initialData }: RecipeFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!initialData

  const [selectedMealIds, setSelectedMealIds] = useState<string[]>(
    initialData?.meals?.map((m) => m.mealId) ?? [],
  )
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    initialData?.courses?.map((c) => c.courseId) ?? [],
  )
  const [selectedPrepIds, setSelectedPrepIds] = useState<string[]>(
    initialData?.preparations?.map((p) => p.preparationId) ?? [],
  )

  const { data: classifications } = useQuery(trpc.classifications.list.queryOptions())
  const { data: allMeals } = useQuery(trpc.meals.list.queryOptions())
  const { data: allCourses } = useQuery(trpc.courses.list.queryOptions())
  const { data: allPreparations } = useQuery(trpc.preparations.list.queryOptions())

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      classificationId: initialData?.classificationId ?? "",
      ingredients: initialData?.ingredients ?? "",
      instructions: initialData?.instructions ?? "",
      notes: initialData?.notes ?? "",
      prepTime: initialData?.prepTime?.toString() ?? "",
      cookTime: initialData?.cookTime?.toString() ?? "",
      servings: initialData?.servings?.toString() ?? "",
      difficulty: initialData?.difficulty ?? "",
      isPublic: initialData?.isPublic ?? true,
      calories: initialData?.calories?.toString() ?? "",
      fat: initialData?.fat?.toString() ?? "",
      cholesterol: initialData?.cholesterol?.toString() ?? "",
      sodium: initialData?.sodium?.toString() ?? "",
      protein: initialData?.protein?.toString() ?? "",
    },
  })

  const createMutation = useMutation(trpc.recipes.create.mutationOptions())
  const updateMutation = useMutation(trpc.recipes.update.mutationOptions())
  const isPending = createMutation.isPending || updateMutation.isPending

  function toNum(v: string | undefined): number | undefined {
    if (!v) return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }

  function toPayload(values: RecipeFormValues) {
    return {
      name: values.name,
      classificationId: values.classificationId || undefined,
      ingredients: values.ingredients || undefined,
      instructions: values.instructions || undefined,
      notes: values.notes || undefined,
      prepTime: toNum(values.prepTime),
      cookTime: toNum(values.cookTime),
      servings: toNum(values.servings),
      difficulty: (
        values.difficulty === "easy" || values.difficulty === "medium" || values.difficulty === "hard"
          ? values.difficulty
          : undefined
      ) as "easy" | "medium" | "hard" | undefined,
      isPublic: values.isPublic,
      calories: toNum(values.calories),
      fat: toNum(values.fat),
      cholesterol: toNum(values.cholesterol),
      sodium: toNum(values.sodium),
      protein: toNum(values.protein),
    }
  }

  async function onSubmit(values: RecipeFormValues) {
    const payload = toPayload(values)
    const taxonomyIds = {
      mealIds: selectedMealIds.length ? selectedMealIds : undefined,
      courseIds: selectedCourseIds.length ? selectedCourseIds : undefined,
      preparationIds: selectedPrepIds.length ? selectedPrepIds : undefined,
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ id: initialData.id, ...payload, ...taxonomyIds })
      await queryClient.invalidateQueries({ queryKey: [["recipes"]] })
      navigate({ to: "/recipes/$recipeId", params: { recipeId: initialData.id } })
    } else {
      const created = await createMutation.mutateAsync({ ...payload, ...taxonomyIds })
      await queryClient.invalidateQueries({ queryKey: [["recipes"]] })
      navigate({ to: "/recipes/$recipeId", params: { recipeId: created.id } })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {isEdit ? "Edit Recipe" : "Create New Recipe"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Recipe Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipe Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter recipe name"
              {...register("name")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Classification */}
          <div>
            <label htmlFor="classificationId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              id="classificationId"
              {...register("classificationId")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
            >
              <option value="">Select a category</option>
              {classifications?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Add notes about this recipe"
              {...register("notes")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Timings & Servings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prep Time (minutes)
              </label>
              <input
                id="prepTime"
                type="number"
                placeholder="30"
                {...register("prepTime")}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cook Time (minutes)
              </label>
              <input
                id="cookTime"
                type="number"
                placeholder="45"
                {...register("cookTime")}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="servings" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Servings
              </label>
              <input
                id="servings"
                type="number"
                placeholder="4"
                {...register("servings")}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            <select
              id="difficulty"
              {...register("difficulty")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
            >
              <option value="">Select difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Taxonomy selectors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h3>

            {allMeals?.length ? (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Meals</p>
                <div className="flex flex-wrap gap-2">
                  {allMeals.map((meal) => {
                    const active = selectedMealIds.includes(meal.id)
                    return (
                      <button
                        key={meal.id}
                        type="button"
                        onClick={() =>
                          setSelectedMealIds((prev) =>
                            active ? prev.filter((id) => id !== meal.id) : [...prev, meal.id],
                          )
                        }
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          active
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                            : "bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600"
                        }`}
                      >
                        {meal.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {allCourses?.length ? (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Courses</p>
                <div className="flex flex-wrap gap-2">
                  {allCourses.map((course) => {
                    const active = selectedCourseIds.includes(course.id)
                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() =>
                          setSelectedCourseIds((prev) =>
                            active ? prev.filter((id) => id !== course.id) : [...prev, course.id],
                          )
                        }
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          active
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                            : "bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600"
                        }`}
                      >
                        {course.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {allPreparations?.length ? (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preparations</p>
                <div className="flex flex-wrap gap-2">
                  {allPreparations.map((prep) => {
                    const active = selectedPrepIds.includes(prep.id)
                    return (
                      <button
                        key={prep.id}
                        type="button"
                        onClick={() =>
                          setSelectedPrepIds((prev) =>
                            active ? prev.filter((id) => id !== prep.id) : [...prev, prep.id],
                          )
                        }
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          active
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                            : "bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600"
                        }`}
                      >
                        {prep.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Public toggle */}
          <div className="flex items-center gap-3">
            <input
              id="isPublic"
              type="checkbox"
              {...register("isPublic")}
              className="w-4 h-4 text-cyan-500 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="isPublic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Public recipe (visible to everyone)
            </label>
          </div>

          {/* Ingredients */}
          <div>
            <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ingredients
            </label>
            <textarea
              id="ingredients"
              rows={8}
              placeholder="Enter ingredients, one per line"
              {...register("ingredients")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white font-mono text-sm"
            />
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instructions
            </label>
            <textarea
              id="instructions"
              rows={8}
              placeholder="Enter instructions, one step per line"
              {...register("instructions")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white font-mono text-sm"
            />
          </div>

          {/* Nutrition */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Nutrition (per serving)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label htmlFor="calories" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calories
                </label>
                <input
                  id="calories"
                  type="number"
                  placeholder="0"
                  {...register("calories")}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="fat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fat (g)
                </label>
                <input
                  id="fat"
                  type="number"
                  placeholder="0"
                  {...register("fat")}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="cholesterol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cholesterol (mg)
                </label>
                <input
                  id="cholesterol"
                  type="number"
                  placeholder="0"
                  {...register("cholesterol")}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="sodium" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sodium (mg)
                </label>
                <input
                  id="sodium"
                  type="number"
                  placeholder="0"
                  {...register("sodium")}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="protein" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Protein (g)
                </label>
                <input
                  id="protein"
                  type="number"
                  placeholder="0"
                  {...register("protein")}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Update Recipe"
                  : "Create Recipe"}
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/recipes" })}
              className="px-6 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
