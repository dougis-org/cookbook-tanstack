import { type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Printer, ArrowLeft } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'

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

function TocRecipeItem({ recipe, index }: { recipe: TocRecipe; index: number }) {
  return (
    <li className="print:break-inside-avoid">
      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: recipe.id }}
        className="flex items-baseline gap-3 group py-2 border-b border-slate-700/50 print:border-gray-200 print:text-black"
      >
        <RecipeIndexNumber index={index} />
        <span className="flex-1 text-white print:text-black group-hover:text-cyan-400 transition-colors print:group-hover:text-black">
          {recipe.name}
        </span>
        <RecipeTimeSpan prepTime={recipe.prepTime} cookTime={recipe.cookTime} />
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

    let globalIndex = 0
    return (
      <div className="space-y-6">
        {sortedChapters.map((chapter) => {
          const chapterRecipes = recipesByChapter.get(chapter.id) ?? []
          return (
            <div key={chapter.id}>
              <h2 className="text-lg font-semibold text-white print:text-black mb-2 border-b border-slate-600 print:border-gray-300 pb-1 print:break-after-avoid">
                {chapter.name}
              </h2>
              <ol className="space-y-2 print:space-y-0 print:columns-2 print:gap-8">
                {chapterRecipes.map((recipe) => (
                  <TocRecipeItem key={recipe.id} recipe={recipe} index={globalIndex++} />
                ))}
              </ol>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <ol className="space-y-2 print:space-y-0 print:columns-2 print:gap-8">
      {recipes.map((recipe, index) => (
        <TocRecipeItem key={recipe.id} recipe={recipe} index={index} />
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
}: {
  prepTime?: number | null
  cookTime?: number | null
}) {
  const label = [
    prepTime && `${prepTime}m prep`,
    cookTime && `${cookTime}m cook`,
  ]
    .filter(Boolean)
    .join(', ')
  return <span className="text-gray-500 print:text-gray-400 text-xs">{label}</span>
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
        <button
          onClick={() => window.print()}
          className="print:hidden flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>
    </>
  )
}

export function CookbookPageHeader({
  name,
  description,
}: {
  name: string
  description?: string | null
}) {
  return (
    <header className="mb-8 text-center border-b border-slate-700 print:border-gray-300 pb-6">
      <h1 className="text-4xl font-bold text-white print:text-black mb-2">{name}</h1>
      {description && (
        <p className="text-gray-300 print:text-gray-700">{description}</p>
      )}
      <p className="text-gray-400 print:text-gray-600 text-sm mt-2">
        Table of Contents
      </p>
    </header>
  )
}
