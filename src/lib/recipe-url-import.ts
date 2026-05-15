import { TRPCError } from '@trpc/server'
import { importedRecipeSchema, type ImportedRecipeInput } from './validation'
import { AIExtractor } from './ai-extractor'

export function validateImportUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid URL' })
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only HTTP and HTTPS URLs are allowed' })
  }

  const hostname = parsed.hostname.toLowerCase()

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]'
  ) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'URL not allowed' })
  }

  // Block IPv4 loopback (127.0.0.0/8), link-local (169.254.0.0/16), and private ranges
  if (
    /^127\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname)
  ) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'URL not allowed' })
  }

  // Block 172.16.0.0/12
  const parts = hostname.split('.')
  if (parts.length === 4 && parts[0] === '172') {
    const second = parseInt(parts[1], 10)
    if (second >= 16 && second <= 31) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'URL not allowed' })
    }
  }
}

export async function fetchAndNormalizeRecipe(
  url: string,
  extractor: AIExtractor
): Promise<ImportedRecipeInput> {
  validateImportUrl(url)

  let html: string

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(url, { signal: controller.signal })

      // Re-validate the final URL after redirects to prevent open-redirect SSRF
      if (response.url && response.url !== url) {
        validateImportUrl(response.url)
      }

      if (!response.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch URL: HTTP ${response.status}`,
        })
      }

      html = await response.text()
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error
    }

    const isAbort =
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('abort'))

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: isAbort
        ? 'The URL timed out. Try again or use file import.'
        : error instanceof Error
          ? `Failed to fetch URL: ${error.message}`
          : 'Failed to fetch URL',
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

function isRecipeType(type: unknown): boolean {
  if (type === 'Recipe') return true
  if (Array.isArray(type)) return (type as string[]).includes('Recipe')
  return false
}

function extractSchemaOrgRecipe(html: string): Record<string, unknown> | null {
  const ldJsonRegex = /<script[^>]*type=['"]?application\/ld\+json['"]?[^>]*>([\s\S]*?)<\/script>/gi
  let match

  while ((match = ldJsonRegex.exec(html))) {
    try {
      const data = JSON.parse(match[1])

      if (isRecipeType(data['@type'])) {
        return normalizeSchemaOrgRecipe(data)
      }

      // Top-level array of items
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && isRecipeType(item['@type'])) {
            return normalizeSchemaOrgRecipe(item)
          }
        }
      }

      // @graph pattern (WordPress/Yoast/Squarespace)
      if (data['@graph'] && Array.isArray(data['@graph'])) {
        for (const item of data['@graph'] as Record<string, unknown>[]) {
          if (item && isRecipeType(item['@type'])) {
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
  const text = html
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
