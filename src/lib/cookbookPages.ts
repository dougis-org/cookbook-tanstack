interface DisplayOrderRecipe {
  id: string
  orderIndex: number
  chapterId?: string | null
}

interface DisplayOrderChapter {
  id: string
  orderIndex: number
}

export function getDisplayOrderedRecipes<
  TRecipe extends DisplayOrderRecipe,
  TChapter extends DisplayOrderChapter,
>(recipes: TRecipe[], chapters: TChapter[] = []): TRecipe[] {
  const sortedRecipes = recipes.slice().sort((a, b) => a.orderIndex - b.orderIndex)

  if (chapters.length === 0) {
    return sortedRecipes
  }

  const sortedChapters = chapters.slice().sort((a, b) => a.orderIndex - b.orderIndex)
  const recipesByChapter = new Map<string, TRecipe[]>()
  const uncategorized: TRecipe[] = []

  for (const recipe of sortedRecipes) {
    if (!recipe.chapterId) {
      uncategorized.push(recipe)
      continue
    }

    if (!recipesByChapter.has(recipe.chapterId)) {
      recipesByChapter.set(recipe.chapterId, [])
    }

    recipesByChapter.get(recipe.chapterId)!.push(recipe)
  }

  return [
    ...sortedChapters.flatMap((chapter) => recipesByChapter.get(chapter.id) ?? []),
    ...uncategorized,
  ]
}

/**
 * Returns a map of recipeId → estimated print page number.
 * Uses a flat 1-page-per-recipe heuristic (first recipe = page 1).
 * Designed for reuse by TOC (#191), alphabetical index (#245), and print view (#246).
 */
export function buildPageMap(recipes: { id: string }[]): Map<string, number> {
  const map = new Map<string, number>()
  recipes.forEach((recipe, i) => {
    map.set(recipe.id, i + 1)
  })
  return map
}
