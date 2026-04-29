import { useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, X } from 'lucide-react'
import { z } from 'zod'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useTierEntitlements } from '@/hooks/useTierEntitlements'
import PageLayout from '@/components/layout/PageLayout'
import RecipeCard from '@/components/recipes/RecipeCard'
import TierWall from '@/components/ui/TierWall'
import { FilterRow1Quick } from '@/components/recipes/filters/FilterRow1Quick'
import { FilterDropdowns } from '@/components/recipes/filters/FilterDropdowns'

const searchSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(['name_asc', 'name_desc', 'newest', 'oldest', 'servings_asc', 'servings_desc', 'updated_desc']).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  classificationIds: z.array(z.string()).optional(),
  sourceIds: z.array(z.string()).optional(),
  mealIds: z.array(z.string()).optional(),
  courseIds: z.array(z.string()).optional(),
  preparationIds: z.array(z.string()).optional(),
  myRecipes: z.boolean().optional(),
  markedByMe: z.boolean().optional(),
  hasImage: z.boolean().optional(),
})

type Search = z.infer<typeof searchSchema>

export const Route = createFileRoute('/recipes/')({
  component: RecipesPage,
  validateSearch: searchSchema,
})

/** Badge showing an active filter with an X to remove it. */
function ActiveBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/50 text-[var(--theme-accent)] text-xs font-medium">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label} filter`} className="p-0.5 rounded-full hover:bg-[var(--theme-accent)]/20 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

export function RecipesPage() {
  const navigate = useNavigate({ from: '/recipes/' })
  const {
    search = '',
    sort = 'newest',
    page = 1,
    pageSize = 20,
    classificationIds,
    sourceIds,
    mealIds,
    courseIds,
    preparationIds,
    myRecipes,
    markedByMe,
    hasImage,
  } = Route.useSearch()

const { isLoggedIn, userId } = useAuth()
const { recipeLimit, canImport } = useTierEntitlements()

const { data: ownedUsageData, isLoading: isUsageLoading } = useQuery({
  ...trpc.usage.getOwned.queryOptions(),
  enabled: isLoggedIn,
})
const myRecipeCount = ownedUsageData?.recipeCount ?? 0
const atRecipeLimit = isLoggedIn && !isUsageLoading && ownedUsageData && myRecipeCount >= recipeLimit
  const { data, isLoading } = useQuery(
    trpc.recipes.list.queryOptions({
      search: search || undefined,
      sort,
      page,
      pageSize,
      classificationIds,
      sourceIds,
      mealIds,
      courseIds,
      preparationIds,
      userId: myRecipes ? userId || undefined : undefined,
      markedByMe,
      hasImage,
    }),
  )

  const { data: classifications } = useQuery(trpc.classifications.list.queryOptions())
  const { data: sources } = useQuery(trpc.sources.list.queryOptions())
  const { data: allMeals } = useQuery(trpc.meals.list.queryOptions())
  const { data: allCourses } = useQuery(trpc.courses.list.queryOptions())
  const { data: allPreparations } = useQuery(trpc.preparations.list.queryOptions())

  const recipes = data?.items ?? []
  const total = data?.total ?? 0

  const filterCounts = {
    classificationCounts: Object.fromEntries(
      (classifications ?? []).map((c) => [c.id, c.recipeCount]),
    ),
    sourceCounts: Object.fromEntries(
      (sources ?? []).map((s) => [s.id, s.recipeCount]),
    ),
    mealCounts: Object.fromEntries(
      (allMeals ?? []).map((m) => [m.id, m.recipeCount]),
    ),
    courseCounts: Object.fromEntries(
      (allCourses ?? []).map((c) => [c.id, c.recipeCount]),
    ),
    preparationCounts: Object.fromEntries(
      (allPreparations ?? []).map((p) => [p.id, p.recipeCount]),
    ),
  }
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const hasActiveFilters = !!(
    classificationIds?.length || sourceIds?.length || mealIds?.length || courseIds?.length ||
    preparationIds?.length || myRecipes || markedByMe || hasImage
  )

  const updateSearch = useCallback(
    (updates: Partial<Search>) => {
      navigate({ search: (prev) => ({ ...prev, ...updates, page: updates.page ?? 1 }) })
    },
    [navigate],
  )

  function clearFilters() {
    navigate({ search: (prev) => ({ search: prev.search, sort: prev.sort, page: 1, pageSize: prev.pageSize }) })
  }

  function arrayRemoveBadge(key: keyof Search, allIds: string[] | undefined, id: string) {
    return () => {
      const next = (allIds ?? []).filter((v) => v !== id)
      updateSearch({ [key]: next.length ? next : undefined } as Partial<Search>)
    }
  }

  // Build active filter badge list for display
  const activeBadges: { label: string; onRemove: () => void }[] = [
    ...(myRecipes ? [{ label: 'My Recipes', onRemove: () => updateSearch({ myRecipes: undefined }) }] : []),
    ...(markedByMe ? [{ label: 'Favorites', onRemove: () => updateSearch({ markedByMe: undefined }) }] : []),
    ...(hasImage ? [{ label: 'Has Image', onRemove: () => updateSearch({ hasImage: undefined }) }] : []),
    ...(classificationIds ?? []).map((id) => ({
      label: classifications?.find((c) => c.id === id)?.name ?? 'Category',
      onRemove: arrayRemoveBadge('classificationIds', classificationIds, id),
    })),
    ...(sourceIds ?? []).map((id) => ({
      label: sources?.find((s) => s.id === id)?.name ?? 'Source',
      onRemove: arrayRemoveBadge('sourceIds', sourceIds, id),
    })),
    ...(mealIds ?? []).map((id) => ({
      label: allMeals?.find((m) => m.id === id)?.name ?? 'Meal',
      onRemove: arrayRemoveBadge('mealIds', mealIds, id),
    })),
    ...(courseIds ?? []).map((id) => ({
      label: allCourses?.find((c) => c.id === id)?.name ?? 'Course',
      onRemove: arrayRemoveBadge('courseIds', courseIds, id),
    })),
    ...(preparationIds ?? []).map((id) => ({
      label: allPreparations?.find((p) => p.id === id)?.name ?? 'Prep',
      onRemove: arrayRemoveBadge('preparationIds', preparationIds, id),
    })),
  ]

  const paginationBtnClass = 'p-2 rounded-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-fg)] disabled:opacity-30 hover:bg-[var(--theme-surface-hover)] transition-colors'

  return (
    <PageLayout role="public-content" title="Recipes" description="Browse and discover delicious recipes">
      {/* Sort + Page-size bar */}
      <div className="print:hidden mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={sort}
            onChange={(e) => updateSearch({ sort: e.target.value as typeof sort })}
            aria-label="Sort recipes"
            className="px-3 py-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-fg)] text-sm focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
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
            className="px-3 py-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-fg)] text-sm focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
            aria-label="Results per page"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          {isLoggedIn && (
            <>
              {canImport ? (
                <Link
                  to="/import"
                  className="flex items-center gap-2 px-5 py-2 bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] font-semibold rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Import Recipe
                </Link>
              ) : null}
              <div className="flex flex-col gap-1">
                {atRecipeLimit ? (
                  <>
                    <button
                      disabled
                      className="flex items-center gap-2 px-5 py-2 bg-[var(--theme-accent)] opacity-50 cursor-not-allowed text-white font-semibold rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      New Recipe
                    </button>
                    <TierWall reason="count-limit" display="inline" />
                  </>
                ) : (
                  <Link
                    to="/recipes/new"
                    className="flex items-center gap-2 px-5 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-semibold rounded-lg transition-colors shadow-lg text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Recipe
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="print:hidden mb-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-[var(--theme-fg-subtle)]">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <button data-testid="clear-all-filters" onClick={clearFilters} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--theme-surface-hover)] text-[var(--theme-fg-muted)] hover:bg-[var(--theme-border)] transition-colors text-xs">
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Row 1: Quick Filters */}
        <FilterRow1Quick
          myRecipes={myRecipes}
          markedByMe={markedByMe}
          hasImage={hasImage}
          isLoggedIn={isLoggedIn}
          updateSearch={updateSearch}
        />

        {/* Dropdown Filters */}
        <FilterDropdowns
          classificationIds={classificationIds}
          sourceIds={sourceIds}
          mealIds={mealIds}
          courseIds={courseIds}
          preparationIds={preparationIds}
          classifications={classifications}
          sources={sources}
          meals={allMeals}
          courses={allCourses}
          preparations={allPreparations}
          updateSearch={updateSearch}
          counts={filterCounts}
        />

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
        <p className="text-sm text-[var(--theme-fg-subtle)] mb-4">
          {total === 0 ? 'No recipes found' : `${total} recipe${total === 1 ? '' : 's'}`}
        </p>
      )}

      {/* Recipe grid */}
      {isLoading ? (
        <div className="text-center py-12"><p className="text-[var(--theme-fg-subtle)]">Loading recipes...</p></div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12">
          {hasActiveFilters || search ? (
            <button onClick={() => navigate({ search: {} })} className="inline-flex items-center gap-2 px-6 py-2 bg-[var(--theme-surface-hover)] hover:bg-[var(--theme-border)] text-[var(--theme-fg)] font-semibold rounded-lg transition-colors">
              Clear all filters
            </button>
          ) : isLoggedIn ? (
            <Link to="/recipes/new" className="inline-flex items-center gap-2 px-6 py-2 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-semibold rounded-lg transition-colors">
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
                <RecipeCard
                  recipe={recipe}
                  marked={isLoggedIn ? recipe.marked : undefined}
                  isOwner={isLoggedIn && recipe.userId === userId}
                />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-[var(--theme-fg-muted)]">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} recipes
              </p>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => updateSearch({ page: 1 })}
                  className={paginationBtnClass}
                  aria-label="First page"
                ><ChevronsLeft className="w-4 h-4" /></button>
                <button disabled={page <= 1} onClick={() => updateSearch({ page: page - 1 })}
                  className={paginationBtnClass}
                  aria-label="Previous page"
                ><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-3 py-1 text-sm text-[var(--theme-fg-muted)] min-w-[90px] text-center">
                  Page {page} of {totalPages}
                </span>
                <button disabled={page >= totalPages} onClick={() => updateSearch({ page: page + 1 })}
                  className={paginationBtnClass}
                  aria-label="Next page"
                ><ChevronRight className="w-4 h-4" /></button>
                <button disabled={page >= totalPages} onClick={() => updateSearch({ page: totalPages })}
                  className={paginationBtnClass}
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
