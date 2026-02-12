/**
 * Adapt a DB recipe row (uses `name`) to the component prop shape (uses `title`).
 */
export function toRecipeProps<T extends { name: string }>(recipe: T) {
  return { ...recipe, title: recipe.name }
}
