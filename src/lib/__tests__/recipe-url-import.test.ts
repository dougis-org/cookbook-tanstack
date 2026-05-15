import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TRPCError } from '@trpc/server'
import { fetchAndNormalizeRecipe, validateImportUrl } from '../recipe-url-import'
import { AIExtractor } from '../ai-extractor'

const mockAIExtractor: AIExtractor = {
  extract: vi.fn(),
}

const TEST_URL = 'https://example.com/recipe'

function mockFetch(html: string, ok = true, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    text: () => Promise.resolve(html),
  })
}

function mockAIResponse(overrides: Record<string, unknown> = {}) {
  vi.mocked(mockAIExtractor.extract).mockResolvedValue(
    JSON.stringify({
      name: 'AI Recipe',
      ingredients: 'ingredient 1, ingredient 2',
      instructions: 'test',
      ...overrides,
    })
  )
}

describe('validateImportUrl', () => {
  it('accepts a valid https URL', () => {
    expect(() => validateImportUrl('https://example.com/recipe')).not.toThrow()
  })

  it('accepts a valid http URL', () => {
    expect(() => validateImportUrl('http://example.com/recipe')).not.toThrow()
  })

  it('rejects localhost', () => {
    expect(() => validateImportUrl('http://localhost/recipe')).toThrow(TRPCError)
  })

  it('rejects localhost subdomains', () => {
    expect(() => validateImportUrl('http://foo.localhost/recipe')).toThrow(TRPCError)
  })

  it('rejects 127.0.0.1 loopback', () => {
    expect(() => validateImportUrl('http://127.0.0.1/recipe')).toThrow(TRPCError)
  })

  it('rejects all 127.x.x.x addresses', () => {
    expect(() => validateImportUrl('http://127.1.2.3/recipe')).toThrow(TRPCError)
  })

  it('rejects 0.0.0.0', () => {
    expect(() => validateImportUrl('http://0.0.0.0/recipe')).toThrow(TRPCError)
  })

  it('rejects IPv6 loopback ::1', () => {
    expect(() => validateImportUrl('http://[::1]/recipe')).toThrow(TRPCError)
  })

  it('rejects 10.x.x.x private range', () => {
    expect(() => validateImportUrl('http://10.0.0.1/recipe')).toThrow(TRPCError)
  })

  it('rejects 192.168.x.x private range', () => {
    expect(() => validateImportUrl('http://192.168.1.1/recipe')).toThrow(TRPCError)
  })

  it('rejects 172.16.x.x private range', () => {
    expect(() => validateImportUrl('http://172.16.0.1/recipe')).toThrow(TRPCError)
  })

  it('rejects 172.31.x.x private range', () => {
    expect(() => validateImportUrl('http://172.31.255.255/recipe')).toThrow(TRPCError)
  })

  it('allows 172.32.x.x (outside private range)', () => {
    expect(() => validateImportUrl('http://172.32.0.1/recipe')).not.toThrow()
  })

  it('rejects file:// protocol', () => {
    expect(() => validateImportUrl('file:///etc/passwd')).toThrow(TRPCError)
  })

  it('rejects ftp:// protocol', () => {
    expect(() => validateImportUrl('ftp://example.com/file')).toThrow(TRPCError)
  })

  it('rejects invalid URL strings', () => {
    expect(() => validateImportUrl('not a url')).toThrow(TRPCError)
  })
})

describe('Schema.org normalize helpers (via fetchAndNormalizeRecipe)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function ldJson(recipe: Record<string, unknown>) {
    return `<script type="application/ld+json">${JSON.stringify({ '@type': 'Recipe', name: 'Test', ...recipe })}</script>`
  }

  async function extractSchema(recipe: Record<string, unknown>) {
    mockFetch(ldJson(recipe))
    return fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)
  }

  it('extracts Recipe from an ld+json array wrapper', async () => {
    mockFetch(`<script type="application/ld+json">${JSON.stringify([{ '@type': 'WebPage' }, { '@type': 'Recipe', name: 'Array Recipe', recipeIngredient: ['flour'], recipeInstructions: 'Bake' }])}</script>`)
    const result = await fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)
    expect(result.name).toBe('Array Recipe')
  })

  it('skips invalid JSON ld+json blocks and continues', async () => {
    mockFetch(`
      <script type="application/ld+json">not valid json</script>
      <script type="application/ld+json">${JSON.stringify({ '@type': 'Recipe', name: 'Valid', recipeIngredient: ['egg'], recipeInstructions: 'Cook' })}</script>
    `)
    const result = await fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)
    expect(result.name).toBe('Valid')
  })

  it('handles ld+json with single-quote type attribute', async () => {
    mockFetch(`<script type='application/ld+json'>${JSON.stringify({ '@type': 'Recipe', name: 'Single Quote', recipeIngredient: ['flour'], recipeInstructions: 'Mix' })}</script>`)
    const result = await fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)
    expect(result.name).toBe('Single Quote')
  })

  it('normalizes string ingredients directly', async () => {
    const result = await extractSchema({ recipeIngredient: 'egg, flour, sugar' })
    expect(result.ingredients).toBe('egg, flour, sugar')
  })

  it('normalizes array ingredients to newline-joined string', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg', 'flour'], recipeInstructions: 'Mix' })
    expect(result.ingredients).toBe('egg\nflour')
  })

  it('normalizes ingredient objects with .text property', async () => {
    const result = await extractSchema({ recipeIngredient: [{ text: '2 eggs' }, 'flour'], recipeInstructions: 'Mix' })
    expect(result.ingredients).toContain('2 eggs')
    expect(result.ingredients).toContain('flour')
  })

  it('normalizes string instructions directly', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Mix everything' })
    expect(result.instructions).toBe('Mix everything')
  })

  it('normalizes instruction objects with .text property', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: [{ text: 'Step 1' }, { text: 'Step 2' }] })
    expect(result.instructions).toBe('Step 1\nStep 2')
  })

  it('normalizes instruction array with mixed string and object items', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: ['Step 1', { text: 'Step 2' }, { '@type': 'HowToStep' }] })
    expect(result.instructions).toContain('Step 1')
    expect(result.instructions).toContain('Step 2')
  })

  it('normalizes instruction as single object with .text', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: { text: 'Just one step' } })
    expect(result.instructions).toBe('Just one step')
  })

  it('normalizes numeric servings', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Cook', recipeYield: 4 })
    expect(result.servings).toBe(4)
  })

  it('normalizes string servings with digit extraction', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Cook', recipeYield: '6 servings' })
    expect(result.servings).toBe(6)
  })

  it('normalizes array servings by using first element', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Cook', recipeYield: ['8 portions', '10 portions'] })
    expect(result.servings).toBe(8)
  })

  it('normalizes ISO 8601 duration with hours and minutes', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Cook', prepTime: 'PT1H30M', cookTime: 'PT45M' })
    expect(result.prepTime).toBe(90)
    expect(result.cookTime).toBe(45)
  })

  it('normalizes numeric duration directly', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Cook', prepTime: 20 })
    expect(result.prepTime).toBe(20)
  })

  it('normalizes image as array (uses first element)', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Cook', image: ['https://example.com/a.jpg', 'https://example.com/b.jpg'] })
    expect(result.imageUrl).toBe('https://example.com/a.jpg')
  })

  it('normalizes image as object with url property', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Cook', image: { url: 'https://example.com/img.jpg' } })
    expect(result.imageUrl).toBe('https://example.com/img.jpg')
  })

  it('normalizes image as object with @value property', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Cook', image: { '@value': 'https://example.com/img2.jpg' } })
    expect(result.imageUrl).toBe('https://example.com/img2.jpg')
  })

  it('returns undefined ingredients for non-string non-array value', async () => {
    const result = await extractSchema({ recipeIngredient: {}, recipeInstructions: 'Cook' })
    expect(result.ingredients).toBeUndefined()
  })

  it('returns undefined instructions for object without text property', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: { '@type': 'HowToSection' } })
    expect(result.instructions).toBeUndefined()
  })

  it('returns undefined servings for non-number non-string non-array value', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Cook', recipeYield: {} })
    expect(result.servings).toBeUndefined()
  })

  it('returns undefined time for string not matching ISO 8601', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Cook', prepTime: 'thirty minutes' })
    expect(result.prepTime).toBeUndefined()
  })

  it('returns undefined imageUrl for object without url or @value', async () => {
    const result = await extractSchema({ recipeIngredient: ['egg'], recipeInstructions: 'Cook', image: { someOther: 'value' } })
    expect(result.imageUrl).toBeUndefined()
  })
})

describe('fetchAndNormalizeRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects localhost URLs before fetching', async () => {
    global.fetch = vi.fn()
    await expect(
      fetchAndNormalizeRecipe('http://localhost/recipe', mockAIExtractor)
    ).rejects.toThrow(TRPCError)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('extracts and returns recipe from valid Schema.org ld+json', async () => {
    const html = `
      <html>
        <script type="application/ld+json">
          {
            "@type": "Recipe",
            "name": "Pasta Carbonara",
            "ingredients": ["eggs", "bacon"],
            "instructions": "Mix and cook"
          }
        </script>
      </html>
    `
    mockFetch(html)

    const result = await fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)

    expect(result).toEqual(
      expect.objectContaining({
        name: 'Pasta Carbonara',
        isPublic: true,
      })
    )
    expect(mockAIExtractor.extract).not.toHaveBeenCalled()
  })

  it('uses first valid Recipe ld+json block when multiple exist', async () => {
    const html = `
      <script type="application/ld+json">
        {"@type": "Organization"}
      </script>
      <script type="application/ld+json">
        {
          "@type": "Recipe",
          "name": "First Recipe",
          "ingredients": [],
          "instructions": "test"
        }
      </script>
      <script type="application/ld+json">
        {
          "@type": "Recipe",
          "name": "Second Recipe",
          "ingredients": [],
          "instructions": "test2"
        }
      </script>
    `
    mockFetch(html)

    const result = await fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)

    expect(result.name).toBe('First Recipe')
    expect(mockAIExtractor.extract).not.toHaveBeenCalled()
  })

  it('falls back to AI when no ld+json Recipe present', async () => {
    mockFetch(`<html><body>No recipe here</body></html>`)
    mockAIResponse()

    const result = await fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)

    expect(result.name).toBe('AI Recipe')
    expect(mockAIExtractor.extract).toHaveBeenCalled()
    const call = vi.mocked(mockAIExtractor.extract).mock.calls[0][0]
    expect(call.userContent.length).toBeLessThanOrEqual(8000)
  })

  it('falls back to AI when Schema.org fails validation', async () => {
    mockFetch(`
      <script type="application/ld+json">
        { "@type": "Recipe", "ingredients": [] }
      </script>
    `)
    mockAIResponse()

    const result = await fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)

    expect(result.name).toBe('AI Recipe')
  })

  it('sets isPublic to true on all results', async () => {
    mockFetch(`
      <script type="application/ld+json">
        { "@type": "Recipe", "name": "Test", "ingredients": [], "instructions": "test" }
      </script>
    `)

    const result = await fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)

    expect(result.isPublic).toBe(true)
  })

  it('throws TRPCError on fetch timeout (>5s)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('The operation timed out'))

    await expect(
      fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)
    ).rejects.toThrow(TRPCError)
  })

  it('throws TRPCError on non-2xx response', async () => {
    mockFetch('Not found', false, 404)

    await expect(
      fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)
    ).rejects.toThrow(TRPCError)
  })

  it('throws TRPCError on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(
      fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)
    ).rejects.toThrow(TRPCError)
  })

  it('throws TRPCError when AI response is not valid JSON', async () => {
    mockFetch(`<html><body>No recipe</body></html>`)
    vi.mocked(mockAIExtractor.extract).mockResolvedValue('not valid json')

    await expect(
      fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)
    ).rejects.toThrow(TRPCError)
  })

  it('throws TRPCError when AI JSON fails schema validation', async () => {
    mockFetch(`<html><body>No recipe</body></html>`)
    vi.mocked(mockAIExtractor.extract).mockResolvedValue(
      JSON.stringify({ ingredients: [] })
    )

    await expect(
      fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)
    ).rejects.toThrow(TRPCError)
  })

  it('truncates body text to 8000 chars before sending to extractor', async () => {
    const longText = 'a'.repeat(12000)
    mockFetch(`<html><body>${longText}</body></html>`)
    mockAIResponse({ name: 'Recipe' })

    await fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)

    const call = vi.mocked(mockAIExtractor.extract).mock.calls[0][0]
    expect(call.userContent.length).toBeLessThanOrEqual(8000)
  })

  it('throws TRPCError when AI extractor throws', async () => {
    mockFetch(`<html><body>No recipe</body></html>`)
    vi.mocked(mockAIExtractor.extract).mockRejectedValue(new Error('SDK failure'))

    await expect(
      fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)
    ).rejects.toThrow(TRPCError)
  })

  it('aborts fetch after 5 seconds and throws TRPCError', async () => {
    vi.useFakeTimers()
    global.fetch = vi.fn().mockImplementation((_url: string, options: RequestInit) => {
      return new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => {
          reject(new DOMException('The user aborted a request.', 'AbortError'))
        })
      })
    })

    const promise = fetchAndNormalizeRecipe(TEST_URL, mockAIExtractor)
    await vi.advanceTimersByTimeAsync(5001)
    await expect(promise).rejects.toThrow(TRPCError)

    vi.useRealTimers()
  })
})
