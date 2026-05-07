import { TRPCError } from '@trpc/server'
import { importedRecipeSchema, type ImportedRecipeInput } from './validation'
import { AIExtractor } from './ai-extractor'

export async function fetchAndNormalizeRecipe(
  url: string,
  extractor: AIExtractor
): Promise<ImportedRecipeInput> {
  let html: string

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch URL: HTTP ${response.status}`,
      })
    }

    html = await response.text()
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error
    }

    const message =
      error instanceof Error && error.message.includes('abort')
        ? 'The URL timed out. Try again or use file import.'
        : error instanceof Error
          ? `Failed to fetch URL: ${error.message}`
          : 'Failed to fetch URL'

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
    })
  }

  // Try to extract from Schema.org ld+json
  const schemaOrgRecipe = extractSchemaOrgRecipe(html)
  if (schemaOrgRecipe) {
    const parsed = importedRecipeSchema.safeParse(schemaOrgRecipe)
    if (parsed.success) {
      return { ...parsed.data, isPublic: true }
    }
  }

  // Fall back to AI extraction
  const bodyText = extractTextFromHtml(html)
  const truncatedBody = bodyText.substring(0, 8000)

  let aiResponse: string
  try {
    aiResponse = await extractor.extract({
      systemPrompt: `You are a recipe extraction expert. Extract recipe information from the provided HTML/text and return a JSON object with the following structure (only include fields you can extract, use null for missing values):
{
  "name": "string (required, recipe name)",
  "ingredients": "string (comma-separated or numbered list, optional)",
  "instructions": "string (cooking steps, optional)",
  "servings": number (optional),
  "prepTime": number (minutes, optional),
  "cookTime": number (minutes, optional),
  "difficulty": "easy|medium|hard" (optional),
  "notes": "string (optional)"
}
Return ONLY the JSON object, no other text.`,
      userContent: truncatedBody,
      maxOutputTokens: 1024,
    })
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message:
        error instanceof Error
          ? `Recipe extraction failed: ${error.message}`
          : 'Recipe extraction failed',
    })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(aiResponse)
  } catch {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to parse extracted recipe data',
    })
  }

  const validated = importedRecipeSchema.safeParse(parsed)
  if (!validated.success) {
    const issues = validated.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Recipe validation failed: ${issues}`,
    })
  }

  return { ...validated.data, isPublic: true }
}

function extractSchemaOrgRecipe(html: string): Record<string, unknown> | null {
  const ldJsonRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  let match

  while ((match = ldJsonRegex.exec(html))) {
    try {
      const data = JSON.parse(match[1])

      // Check if this is a Recipe or an array containing a Recipe
      if (data['@type'] === 'Recipe') {
        return normalizeSchemaOrgRecipe(data)
      }

      if (Array.isArray(data)) {
        for (const item of data) {
          if (item['@type'] === 'Recipe') {
            return normalizeSchemaOrgRecipe(item)
          }
        }
      }
    } catch {
      // Invalid JSON, continue to next block
      continue
    }
  }

  return null
}

function normalizeSchemaOrgRecipe(
  recipe: Record<string, unknown>
): Record<string, unknown> {
  const ingredients = normalizeIngredients(recipe.recipeIngredient)
  const instructions = normalizeInstructions(recipe.recipeInstructions)
  const servings = normalizeServings(recipe.recipeYield)
  const prepTime = normalizeTime(recipe.prepTime)
  const cookTime = normalizeTime(recipe.cookTime)

  return {
    name: recipe.name,
    ingredients,
    instructions,
    servings,
    prepTime,
    cookTime,
    notes: recipe.description,
    imageUrl: normalizeImageUrl(recipe.image),
  }
}

function normalizeIngredients(
  recipeIngredient: unknown
): string | null | undefined {
  if (!recipeIngredient) return undefined

  if (typeof recipeIngredient === 'string') {
    return recipeIngredient
  }

  if (Array.isArray(recipeIngredient)) {
    return recipeIngredient
      .map((ing) => (typeof ing === 'string' ? ing : ing?.text || String(ing)))
      .join('\n')
  }

  return undefined
}

function normalizeInstructions(
  recipeInstructions: unknown
): string | null | undefined {
  if (!recipeInstructions) return undefined

  if (typeof recipeInstructions === 'string') {
    return recipeInstructions
  }

  if (Array.isArray(recipeInstructions)) {
    return recipeInstructions
      .map((inst) => {
        if (typeof inst === 'string') return inst
        if (inst?.text) return inst.text
        return String(inst)
      })
      .join('\n')
  }

  if (typeof recipeInstructions === 'object' && recipeInstructions !== null) {
    const obj = recipeInstructions as Record<string, unknown>
    if (obj.text) return String(obj.text)
  }

  return undefined
}

function normalizeServings(recipeYield: unknown): number | null | undefined {
  if (!recipeYield) return undefined

  if (typeof recipeYield === 'number') return recipeYield

  if (typeof recipeYield === 'string') {
    const match = recipeYield.match(/\d+/)
    return match ? parseInt(match[0], 10) : undefined
  }

  if (Array.isArray(recipeYield) && recipeYield.length > 0) {
    return normalizeServings(recipeYield[0])
  }

  return undefined
}

function normalizeTime(duration: unknown): number | null | undefined {
  if (!duration) return undefined
  if (typeof duration === 'number') return duration

  // ISO 8601 duration format (e.g., "PT30M")
  if (typeof duration === 'string') {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
    if (match) {
      const hours = parseInt(match[1] || '0', 10)
      const minutes = parseInt(match[2] || '0', 10)
      return hours * 60 + minutes
    }
  }

  return undefined
}

function normalizeImageUrl(image: unknown): string | null | undefined {
  if (!image) return undefined

  if (typeof image === 'string') {
    return image
  }

  if (Array.isArray(image) && image.length > 0) {
    return normalizeImageUrl(image[0])
  }

  if (typeof image === 'object' && image !== null) {
    const obj = image as Record<string, unknown>
    if (typeof obj.url === 'string') return obj.url
    if (typeof obj['@value'] === 'string') return obj['@value'] as string
  }

  return undefined
}

function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()

  return text
}
