import { useRef, useCallback, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, ChevronLeft, ChevronRight, Filter, X, Heart, User } from 'lucide-react'
import { z } from 'zod'
import { trpc } from '@/lib/trpc'
import { useSession } from '@/lib/auth-client'
import PageLayout from '@/components/layout/PageLayout'
import RecipeCard from '@/components/recipes/RecipeCard'

const searchSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(['name_asc', 'name_desc', 'newest', 'oldest']).optional(),
  page: z.number().int().positive().optional(),
  classificationId: z.string().uuid().optional(),
  mealIds: z.array(z.string().uuid()).optional(),
  courseIds: z.array(z.string().uuid()).optional(),
  preparationIds: z.array(z.string().uuid()).optional(),
  myRecipes: z.boolean().optional(),
  markedByMe: z.boolean().optional(),
})

export const Route = createFileRoute('/recipes/')({
  component: RecipesPage,
  validateSearch: searchSchema,
})

function RecipesPage() {
  const navigate = useNavigate({ from: '/recipes/' })
  const {
    search = '',
    sort = 'newest',
    page = 1,
    classificationId,
    mealIds,
    courseIds,
    preparationIds,
    myRecipes,
    markedByMe,
  } = Route.useSearch()

  const { data: session } = useSession()
  const isLoggedIn = !!session?.user

  const { data, isLoading } = useQuery(
    trpc.recipes.list.queryOptions({
      search: search || undefined,
      sort,
      page,
      pageSize: 20,
      classificationId,
      mealIds,
      courseIds,
      preparationIds,
      userId: myRecipes && session?.user?.id ? session.user.id : undefined,
      markedByMe: markedByMe || undefined,
    }),
  )

  const { data: classifications } = useQuery(trpc.classifications.list.queryOptions())
  const { data: allMeals } = useQuery(trpc.meals.list.queryOptions())
  const { data: allCourses } = useQuery(trpc.courses.list.queryOptions())
  const { data: allPreparations } = useQuery(trpc.preparations.list.queryOptions())

  const recipes = data?.items ?? []
  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const hasActiveFilters = !!(classificationId || mealIds?.length || courseIds?.length || preparationIds?.length || myRecipes || markedByMe)

  const updateSearch = useCallback(
    (updates: Partial<z.infer<typeof searchSchema>>) => {
      navigate({
        search: (prev) => ({
          ...prev,
          ...updates,
          page: updates.page ?? 1,
        }),
      })
    },
    [navigate],
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        updateSearch({ search: value || undefined })
      }, 300)
    },
    [updateSearch],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function clearFilters() {
    navigate({
      search: (prev) => ({
        search: prev.search,
        sort: prev.sort,
        page: 1,
      }),
    })
  }

  function toggleArrayFilter(
    key: 'mealIds' | 'courseIds' | 'preparationIds',
    current: string[] | undefined,
    id: string,
  ) {
    const arr = current ?? []
    const next = arr.includes(id) ? arr.filter((v) => v !== id) : [...arr, id]
    updateSearch({ [key]: next.length ? next : undefined })
  }

  return (
    <PageLayout
      title="Recipes"
      description="Browse and discover delicious recipes"
    >
      {/* Search + Sort bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search recipes..."
              defaultValue={search}
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => updateSearch({ sort: e.target.value as typeof sort })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
          </select>

          {isLoggedIn && (
            <Link
              to="/recipes/new"
              className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
            >
              <Plus className="w-5 h-5" />
              New Recipe
            </Link>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 text-gray-300 hover:bg-slate-600 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Personal filters — only shown when logged in */}
          {isLoggedIn && (
            <>
              <button
                onClick={() => updateSearch({ myRecipes: myRecipes ? undefined : true })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  myRecipes
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                My Recipes
              </button>
              <button
                onClick={() => updateSearch({ markedByMe: markedByMe ? undefined : true })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  markedByMe
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                Favorites
              </button>
            </>
          )}

          {/* Classification filter */}
          <select
            value={classificationId ?? ''}
            onChange={(e) => updateSearch({ classificationId: e.target.value || undefined })}
            className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {classifications?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Meal filter chips */}
          {allMeals?.map((meal) => {
            const active = mealIds?.includes(meal.id)
            return (
              <button
                key={meal.id}
                onClick={() => toggleArrayFilter('mealIds', mealIds, meal.id)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'
                }`}
              >
                {meal.name}
              </button>
            )
          })}

          {/* Course filter chips */}
          {allCourses?.map((course) => {
            const active = courseIds?.includes(course.id)
            return (
              <button
                key={course.id}
                onClick={() => toggleArrayFilter('courseIds', courseIds, course.id)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'
                }`}
              >
                {course.name}
              </button>
            )
          })}

          {/* Preparation filter chips */}
          {allPreparations?.map((prep) => {
            const active = preparationIds?.includes(prep.id)
            return (
              <button
                key={prep.id}
                onClick={() => toggleArrayFilter('preparationIds', preparationIds, prep.id)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'
                }`}
              >
                {prep.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Recipe grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading recipes...</p>
        </div>
      ) : !recipes.length ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No recipes found</p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Clear filters
            </button>
          ) : isLoggedIn ? (
            <Link
              to="/recipes/new"
              className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create your first recipe
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Link key={recipe.id} to="/recipes/$recipeId" params={{ recipeId: recipe.id }}>
                <RecipeCard recipe={recipe} />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} recipes
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => updateSearch({ page: page - 1 })}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => updateSearch({ page: page + 1 })}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
