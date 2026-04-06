import { type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'
import PrintButton from '@/components/ui/PrintButton'
import { buildPageMap } from '@/lib/cookbookPages'

const TOC_LIST_CLASSES =
  'space-y-2 sm:space-y-0 sm:columns-2 sm:gap-8 print:space-y-0 print:columns-2 print:gap-8 [&>li]:break-inside-avoid'

interface TocRecipe {
  id: string
  name: string
  prepTime?: number | null
  cookTime?: number | null
  chapterId?: string | null
  orderIndex: number
}

interface TocChapter {
  id: string
  name: string
  orderIndex: number
}

export function RecipePageRow({
  recipe,
  index,
  pageNumber,
}: {
  recipe: TocRecipe
  index?: number
  pageNumber: number
}) {
  return (
    <li className="print:break-inside-avoid">
      <div className="flex items-baseline gap-3 py-2 border-b border-slate-700/50 print:border-gray-200 print:text-black">
        {index !== undefined && <RecipeIndexNumber index={index} />}
        <span className="text-white print:text-black">
          {recipe.name}
        </span>
        <span className="flex-1" />
        <span className="text-gray-500 text-xs tabular-nums print:text-black print:text-sm shrink-0">
          pg {pageNumber}
        </span>
        <RecipeTimeSpan
          prepTime={recipe.prepTime}
          cookTime={recipe.cookTime}
          className="print:hidden"
        />
      </div>
    </li>
  )
}

function TocRecipeItem({
  recipe,
  index,
  pageNumber,
}: {
  recipe: TocRecipe
  index: number
  pageNumber: number
}) {
  return (
    <li className="print:break-inside-avoid">
      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: recipe.id }}
        className="flex items-baseline gap-3 group py-2 border-b border-slate-700/50 print:border-gray-200 print:text-black"
      >
        <RecipeIndexNumber index={index} />
        <span className="text-white print:text-black group-hover:text-cyan-400 transition-colors print:group-hover:text-black">
          {recipe.name}
        </span>
        <span className="flex-1" />
        <span className="text-gray-500 text-xs tabular-nums print:text-black print:text-sm shrink-0">
          pg {pageNumber}
        </span>
        <RecipeTimeSpan
          prepTime={recipe.prepTime}
          cookTime={recipe.cookTime}
          className="print:hidden"
        />
      </Link>
    </li>
  )
}

export function CookbookTocList({
  recipes,
  chapters,
}: {
  recipes: TocRecipe[]
  chapters: TocChapter[]
}) {
  const sortedChapters = chapters.slice().sort((a, b) => a.orderIndex - b.orderIndex)

  if (sortedChapters.length > 0) {
    const recipesByChapter = new Map<string, TocRecipe[]>()
    for (const recipe of recipes) {
      if (recipe.chapterId) {
        if (!recipesByChapter.has(recipe.chapterId)) {
          recipesByChapter.set(recipe.chapterId, [])
        }
        recipesByChapter.get(recipe.chapterId)!.push(recipe)
      }
    }
    recipesByChapter.forEach((chapterRecipes) => {
      chapterRecipes.sort((a, b) => a.orderIndex - b.orderIndex)
    })

    const uncategorized = recipes
      .filter((r) => !r.chapterId)
      .sort((a, b) => a.orderIndex - b.orderIndex)

    // Build display-order list (chapters first, then uncategorized) for correct page numbers
    const displayOrder = [
      ...sortedChapters.flatMap((chapter) => recipesByChapter.get(chapter.id) ?? []),
      ...uncategorized,
    ]
    const pageMap = buildPageMap(displayOrder)

    type ChapterRow = { chapter: TocChapter; rows: { recipe: TocRecipe; index: number }[] }
    let globalIndex = 0
    const chapterRows: ChapterRow[] = sortedChapters.map((chapter) => ({
      chapter,
      rows: (recipesByChapter.get(chapter.id) ?? []).map((recipe) => ({
        recipe,
        index: globalIndex++,
      })),
    }))
    const uncategorizedRows = uncategorized.map((recipe) => ({
      recipe,
      index: globalIndex++,
    }))

    return (
      <div className="space-y-6">
        {chapterRows.map(({ chapter, rows }) => (
          <div key={chapter.id}>
            <h2 className="text-lg font-semibold text-white print:text-black mb-2 border-b border-slate-600 print:border-gray-300 pb-1 print:break-after-avoid">
              {chapter.name}
            </h2>
            <ol className={TOC_LIST_CLASSES}>
              {rows.map(({ recipe, index }) => (
                <TocRecipeItem
                  key={recipe.id}
                  recipe={recipe}
                  index={index}
                  pageNumber={pageMap.get(recipe.id) ?? index + 1}
                />
              ))}
            </ol>
          </div>
        ))}
        {uncategorizedRows.length > 0 && (
          <ol className={TOC_LIST_CLASSES}>
            {uncategorizedRows.map(({ recipe, index }) => (
              <TocRecipeItem
                key={recipe.id}
                recipe={recipe}
                index={index}
                pageNumber={pageMap.get(recipe.id) ?? index + 1}
              />
            ))}
          </ol>
        )}
      </div>
    )
  }

  const pageMap = buildPageMap(recipes)
  return (
    <ol className={TOC_LIST_CLASSES}>
      {recipes.map((recipe, index) => (
        <TocRecipeItem
          key={recipe.id}
          recipe={recipe}
          index={index}
          pageNumber={pageMap.get(recipe.id) ?? index + 1}
        />
      ))}
    </ol>
  )
}

const pageBaseClass =
  'min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900'

export function CookbookStandalonePage({
  children,
  maxWidth = '2xl',
}: {
  children: ReactNode
  maxWidth?: '2xl' | '4xl'
}) {
  const widthClass = maxWidth === '4xl' ? 'max-w-4xl' : 'max-w-2xl'
  return (
    <div className={`${pageBaseClass} print:bg-white print:text-black`}>
      <div className={`${widthClass} print:max-w-4xl mx-auto px-6 py-10`}>{children}</div>
    </div>
  )
}

export function RecipeTimeSpan({
  prepTime,
  cookTime,
  className,
}: {
  prepTime?: number | null
  cookTime?: number | null
  className?: string
}) {
  const label = [
    prepTime && `${prepTime}m prep`,
    cookTime && `${cookTime}m cook`,
  ]
    .filter(Boolean)
    .join(', ')
  return (
    <span className={`text-gray-500 print:text-gray-400 text-xs${className ? ` ${className}` : ''}`}>
      {label}
    </span>
  )
}

export function CookbookEmptyState() {
  return (
    <p className="text-gray-400 text-center py-12 print:hidden">No recipes in this cookbook.</p>
  )
}

export function RecipeIndexNumber({ index }: { index: number }) {
  return (
    <span className="text-gray-500 w-6 text-right shrink-0 text-sm">
      {index + 1}.
    </span>
  )
}

export function CookbookPageLoading() {
  return (
    <div className={`${pageBaseClass} flex items-center justify-center`}>
      <p className="text-gray-400">Loading…</p>
    </div>
  )
}

export function CookbookPageNotFound() {
  return (
    <div className={`${pageBaseClass} flex flex-col items-center justify-center gap-4`}>
      <p className="text-gray-400 text-lg">Cookbook not found.</p>
      <Link to="/cookbooks" className="text-cyan-400 hover:text-cyan-300">
        Back to Cookbooks
      </Link>
    </div>
  )
}

export function CookbookPageChrome({
  cookbookId,
  cookbookName,
  breadcrumbLabel,
}: {
  cookbookId: string
  cookbookName: string
  breadcrumbLabel: string
}) {
  return (
    <>
      <div className="print:hidden mb-2">
        <Breadcrumb
          items={[
            { label: 'Cookbooks', to: '/cookbooks' },
            { label: cookbookName, to: '/cookbooks/$cookbookId', params: { cookbookId } },
            { label: breadcrumbLabel },
          ]}
        />
      </div>
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Link
          to="/cookbooks/$cookbookId"
          params={{ cookbookId }}
          className="print:hidden flex items-center gap-1.5 text-gray-400 hover:text-cyan-400 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cookbook
        </Link>
        <PrintButton />
      </div>
    </>
  )
}

export function CookbookPageHeader({
  name,
  description,
  subtitle = 'Table of Contents',
}: {
  name: string
  description?: string | null
  subtitle?: string
}) {
  return (
    <header className="mb-8 text-center border-b border-slate-700 print:border-gray-300 pb-6">
      <h1 className="text-4xl font-bold text-white print:text-black mb-2">{name}</h1>
      {description && (
        <p className="text-gray-300 print:text-gray-700">{description}</p>
      )}
      <p className="text-gray-400 print:text-gray-600 text-sm mt-2">
        {subtitle}
      </p>
    </header>
  )
}

type IndexItem =
  | { type: 'letter'; letter: string }
  | { type: 'recipe'; recipe: TocRecipe; pageNumber: number }

export function CookbookAlphaIndex({
  recipes,
}: {
  recipes: TocRecipe[]
}) {
  if (recipes.length === 0) return null

  const pageMap = buildPageMap(recipes)

  const groups = new Map<string, TocRecipe[]>()
  const sorted = recipes.slice().sort((a, b) => a.name.localeCompare(b.name))
  for (const recipe of sorted) {
    const firstChar = recipe.name[0]
    const letter = firstChar && /[a-zA-Z]/.test(firstChar) ? firstChar.toUpperCase() : '#'
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(recipe)
  }

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === b) return 0
    if (a === '#') return -1
    if (b === '#') return 1
    return a.localeCompare(b)
  })

  const items: IndexItem[] = []
  for (const letter of sortedKeys) {
    items.push({ type: 'letter', letter })
    for (const recipe of groups.get(letter)!) {
      items.push({ type: 'recipe', recipe, pageNumber: pageMap.get(recipe.id) ?? 1 })
    }
  }

  return (
    <div className="mt-12 print:mt-0 print:break-before-page">
      <h2 className="text-2xl font-bold text-white print:text-black border-b border-slate-700 print:border-gray-300 pb-4">
        Alphabetical Index
      </h2>
      <ol className={TOC_LIST_CLASSES}>
        {items.map((item) =>
          item.type === 'letter' ? (
            <li
              key={item.letter}
              className="font-bold text-white print:text-black print:break-after-avoid pt-4 first:pt-0"
            >
              {item.letter}
            </li>
          ) : (
            <RecipePageRow
              key={item.recipe.id}
              recipe={item.recipe}
              pageNumber={item.pageNumber}
            />
          )
        )}
      </ol>
    </div>
  )
}
