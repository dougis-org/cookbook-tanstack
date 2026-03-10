import { useRef, useCallback, useEffect, useState, type ReactNode } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, X, Heart, User, Image } from 'lucide-react'
import { z } from 'zod'
import { trpc } from '@/lib/trpc'
import { useSession } from '@/lib/auth-client'
import PageLayout from '@/components/layout/PageLayout'
import RecipeCard from '@/components/recipes/RecipeCard'

const searchSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(['name_asc', 'name_desc', 'newest', 'oldest', 'servings_asc', 'servings_desc', 'updated_desc']).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  classificationId: z.string().optional(),
  sourceId: z.string().optional(),
  mealIds: z.array(z.string()).optional(),
  courseIds: z.array(z.string()).optional(),
  preparationIds: z.array(z.string()).optional(),
  myRecipes: z.boolean().optional(),
  markedByMe: z.boolean().optional(),
  hasImage: z.boolean().optional(),
  minServings: z.number().int().positive().optional(),
  maxServings: z.number().int().positive().optional(),
})

type Search = z.infer<typeof searchSchema>

export const Route = createFileRoute('/recipes/')({
  component: RecipesPage,
  validateSearch: searchSchema,
})

function FilterToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
        active ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'
      }`}
    >
      {children}
    </button>
  )
}

/** Badge showing an active filter with an X to remove it. */
function ActiveBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-medium">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label} filter`} className="p-0.5 rounded-full hover:bg-cyan-500/30 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

function RecipesPage() {
  const navigate = useNavigate({ from: '/recipes/' })
  const {
    search = '',
    sort = 'newest',
    page = 1,
    pageSize = 20,
    classificationId,
    sourceId,
    mealIds,
    courseIds,
    preparationIds,
    myRecipes,
    markedByMe,
    hasImage,
    minServings,
    maxServings,
  } = Route.useSearch()

  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchValue, setSearchValue] = useState(search)
  // Keep the controlled input in sync when the URL search param changes externally
  // (e.g. "Clear all filters", navigating back/forward)
  useEffect(() => { setSearchValue(search) }, [search])

  const { data, isLoading } = useQuery(
    trpc.recipes.list.queryOptions({
      search: search || undefined,
      sort,
      page,
      pageSize,
      classificationId,
      sourceId,
      mealIds,
      courseIds,
      preparationIds,
      userId: myRecipes ? session?.user?.id : undefined,
      markedByMe,
      hasImage,
      minServings,
      maxServings,
    }),
  )

  const { data: classifications } = useQuery(trpc.classifications.list.queryOptions())
  const { data: sources } = useQuery(trpc.sources.list.queryOptions())
  const { data: allMeals } = useQuery(trpc.meals.list.queryOptions())
  const { data: allCourses } = useQuery(trpc.courses.list.queryOptions())
  const { data: allPreparations } = useQuery(trpc.preparations.list.queryOptions())

  const recipes = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const hasActiveFilters = !!(
    classificationId || sourceId || mealIds?.length || courseIds?.length ||
    preparationIds?.length || myRecipes || markedByMe || hasImage || minServings || maxServings
  )

  const updateSearch = useCallback(
    (updates: Partial<Search>) => {
      navigate({ search: (prev) => ({ ...prev, ...updates, page: updates.page ?? 1 }) })
    },
    [navigate],
  )

  // Debounced text search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => updateSearch({ search: value || undefined }), 300)
    },
    [updateSearch],
  )
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // Keyboard shortcut: '/' focuses the search input
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function clearFilters() {
    navigate({ search: (prev) => ({ search: prev.search, sort: prev.sort, page: 1, pageSize: prev.pageSize }) })
  }

  function toggleArrayFilter(key: 'mealIds' | 'courseIds' | 'preparationIds', current: string[] | undefined, id: string) {
    const arr = current ?? []
    const next = arr.includes(id) ? arr.filter((v) => v !== id) : [...arr, id]
    updateSearch({ [key]: next.length ? next : undefined })
  }

  // Build active filter badge list for display
  const activeBadges: { label: string; onRemove: () => void }[] = [
    ...(myRecipes ? [{ label: 'My Recipes', onRemove: () => updateSearch({ myRecipes: undefined }) }] : []),
    ...(markedByMe ? [{ label: 'Favorites', onRemove: () => updateSearch({ markedByMe: undefined }) }] : []),
    ...(hasImage ? [{ label: 'Has Image', onRemove: () => updateSearch({ hasImage: undefined }) }] : []),
    ...(classificationId
      ? [{ label: classifications?.find((c) => c.id === classificationId)?.name ?? 'Category', onRemove: () => updateSearch({ classificationId: undefined }) }]
      : []),
    ...(sourceId
      ? [{ label: sources?.find((s) => s.id === sourceId)?.name ?? 'Source', onRemove: () => updateSearch({ sourceId: undefined }) }]
      : []),
    ...(minServings ? [{ label: `≥ ${minServings} servings`, onRemove: () => updateSearch({ minServings: undefined }) }] : []),
    ...(maxServings ? [{ label: `≤ ${maxServings} servings`, onRemove: () => updateSearch({ maxServings: undefined }) }] : []),
    ...(mealIds ?? []).map((id) => ({
      label: allMeals?.find((m) => m.id === id)?.name ?? 'Meal',
      onRemove: () => { const next = (mealIds ?? []).filter((v) => v !== id); updateSearch({ mealIds: next.length ? next : undefined }) },
    })),
    ...(courseIds ?? []).map((id) => ({
      label: allCourses?.find((c) => c.id === id)?.name ?? 'Course',
      onRemove: () => { const next = (courseIds ?? []).filter((v) => v !== id); updateSearch({ courseIds: next.length ? next : undefined }) },
    })),
    ...(preparationIds ?? []).map((id) => ({
      label: allPreparations?.find((p) => p.id === id)?.name ?? 'Prep',
      onRemove: () => { const next = (preparationIds ?? []).filter((v) => v !== id); updateSearch({ preparationIds: next.length ? next : undefined }) },
    })),
  ]

  return (
    <PageLayout title="Recipes" description="Browse and discover delicious recipes">
      {/* Search + Sort + Page-size bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              data-testid="recipe-search-input"
              type="text"
              placeholder="Search recipes..."
              value={searchValue}
              onChange={(e) => { setSearchValue(e.target.value); debouncedSearch(e.target.value) }}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={sort}
            onChange={(e) => updateSearch({ sort: e.target.value as typeof sort })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="updated_desc">Recently updated</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="servings_asc">Servings ↑</option>
            <option value="servings_desc">Servings ↓</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => updateSearch({ pageSize: Number(e.target.value), page: 1 })}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            aria-label="Results per page"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          {isLoggedIn && (
            <Link
              to="/recipes/new"
              className="flex items-center gap-2 px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Recipe
            </Link>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <button data-testid="clear-all-filters" onClick={clearFilters} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 text-gray-300 hover:bg-slate-600 transition-colors text-xs">
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {isLoggedIn && (
            <>
              <FilterToggle active={!!myRecipes} onClick={() => updateSearch({ myRecipes: myRecipes ? undefined : true })}>
                <User className="w-3.5 h-3.5" />
                My Recipes
              </FilterToggle>
              <FilterToggle active={!!markedByMe} onClick={() => updateSearch({ markedByMe: markedByMe ? undefined : true })}>
                <Heart className="w-3.5 h-3.5" />
                Favorites
              </FilterToggle>
            </>
          )}
          <FilterToggle active={!!hasImage} onClick={() => updateSearch({ hasImage: hasImage ? undefined : true })}>
            <Image className="w-3.5 h-3.5" />
            Has Image
          </FilterToggle>

          {/* Classification */}
          <select
            value={classificationId ?? ''}
            onChange={(e) => updateSearch({ classificationId: e.target.value || undefined })}
            className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {classifications?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Source */}
          <select
            value={sourceId ?? ''}
            onChange={(e) => updateSearch({ sourceId: e.target.value || undefined })}
            className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">All Sources</option>
            {sources?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Taxonomy chips */}
        <div className="flex flex-wrap gap-2">
          {allMeals?.map((meal) => (
            <button key={meal.id} data-testid="taxonomy-filter-chip"
              onClick={() => toggleArrayFilter('mealIds', mealIds, meal.id)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${mealIds?.includes(meal.id) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'}`}
            >{meal.name}</button>
          ))}
          {allCourses?.map((course) => (
            <button key={course.id} data-testid="taxonomy-filter-chip"
              onClick={() => toggleArrayFilter('courseIds', courseIds, course.id)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${courseIds?.includes(course.id) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'}`}
            >{course.name}</button>
          ))}
          {allPreparations?.map((prep) => (
            <button key={prep.id} data-testid="taxonomy-filter-chip"
              onClick={() => toggleArrayFilter('preparationIds', preparationIds, prep.id)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${preparationIds?.includes(prep.id) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'}`}
            >{prep.name}</button>
          ))}
        </div>

        {/* Servings range */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Servings:</span>
          <input type="number" min={1} step={1} placeholder="Min"
            value={minServings ?? ''}
            onChange={(e) => {
              const v = e.target.value
              const n = Number(v)
              updateSearch({ minServings: v && Number.isInteger(n) && n > 0 ? n : undefined })
            }}
            className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <span className="text-gray-600">–</span>
          <input type="number" min={1} step={1} placeholder="Max"
            value={maxServings ?? ''}
            onChange={(e) => {
              const v = e.target.value
              const n = Number(v)
              updateSearch({ maxServings: v && Number.isInteger(n) && n > 0 ? n : undefined })
            }}
            className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        {/* Active filter badges */}
        {activeBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {activeBadges.map((b, i) => (
              <ActiveBadge key={i} label={b.label} onRemove={b.onRemove} />
            ))}
          </div>
        )}
      </div>

      {/* Result count */}
      {!isLoading && (
        <p className="text-sm text-gray-400 mb-4">
          {total === 0 ? 'No recipes found' : `${total} recipe${total === 1 ? '' : 's'}`}
        </p>
      )}

      {/* Recipe grid */}
      {isLoading ? (
        <div className="text-center py-12"><p className="text-gray-400">Loading recipes...</p></div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12">
          {hasActiveFilters || search ? (
            <button onClick={() => navigate({ search: {} })} className="inline-flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
              Clear all filters
            </button>
          ) : isLoggedIn ? (
            <Link to="/recipes/new" className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors">
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
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} recipes
              </p>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => updateSearch({ page: 1 })}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors"
                  aria-label="First page"
                ><ChevronsLeft className="w-4 h-4" /></button>
                <button disabled={page <= 1} onClick={() => updateSearch({ page: page - 1 })}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors"
                  aria-label="Previous page"
                ><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-3 py-1 text-sm text-gray-300 min-w-[90px] text-center">
                  Page {page} of {totalPages}
                </span>
                <button disabled={page >= totalPages} onClick={() => updateSearch({ page: page + 1 })}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors"
                  aria-label="Next page"
                ><ChevronRight className="w-4 h-4" /></button>
                <button disabled={page >= totalPages} onClick={() => updateSearch({ page: totalPages })}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white disabled:opacity-30 hover:bg-slate-700 transition-colors"
                  aria-label="Last page"
                ><ChevronsRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
