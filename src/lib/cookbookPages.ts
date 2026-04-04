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
