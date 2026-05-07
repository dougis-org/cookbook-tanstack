import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TRPCError } from '@trpc/server'
import { fetchAndNormalizeRecipe } from '../recipe-url-import'
import { AIExtractor } from '../ai-extractor'

const mockAIExtractor: AIExtractor = {
  extract: vi.fn(),
}

describe('fetchAndNormalizeRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    })

    const result = await fetchAndNormalizeRecipe(
      'https://example.com/recipe',
      mockAIExtractor
    )

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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    })

    const result = await fetchAndNormalizeRecipe(
      'https://example.com/recipe',
      mockAIExtractor
    )

    expect(result.name).toBe('First Recipe')
    expect(mockAIExtractor.extract).not.toHaveBeenCalled()
  })

  it('falls back to AI when no ld+json Recipe present', async () => {
    const html = `<html><body>No recipe here</body></html>`

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    })

    vi.mocked(mockAIExtractor.extract).mockResolvedValue(
      JSON.stringify({
        name: 'AI Recipe',
        ingredients: 'ingredient 1, ingredient 2',
        instructions: 'test',
      })
    )

    const result = await fetchAndNormalizeRecipe(
      'https://example.com/recipe',
      mockAIExtractor
    )

    expect(result.name).toBe('AI Recipe')
    expect(mockAIExtractor.extract).toHaveBeenCalled()
    const call = vi.mocked(mockAIExtractor.extract).mock.calls[0][0]
    expect(call.userContent.length).toBeLessThanOrEqual(8000)
  })

  it('falls back to AI when Schema.org fails validation', async () => {
    const html = `
      <script type="application/ld+json">
        {
          "@type": "Recipe",
          "ingredients": []
        }
      </script>
    `

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    })

    vi.mocked(mockAIExtractor.extract).mockResolvedValue(
      JSON.stringify({
        name: 'AI Recipe',
        ingredients: 'ingredient 1, ingredient 2',
        instructions: 'test',
      })
    )

    const result = await fetchAndNormalizeRecipe(
      'https://example.com/recipe',
      mockAIExtractor
    )

    expect(result.name).toBe('AI Recipe')
  })

  it('sets isPublic to true on all results', async () => {
    const html = `
      <script type="application/ld+json">
        {
          "@type": "Recipe",
          "name": "Test",
          "ingredients": [],
          "instructions": "test"
        }
      </script>
    `

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    })

    const result = await fetchAndNormalizeRecipe(
      'https://example.com/recipe',
      mockAIExtractor
    )

    expect(result.isPublic).toBe(true)
  })

  it('throws TRPCError on fetch timeout (>5s)', async () => {
    global.fetch = vi.fn().mockRejectedValue(
      new Error('The operation timed out')
    )

    await expect(
      fetchAndNormalizeRecipe('https://example.com/recipe', mockAIExtractor)
    ).rejects.toThrow(TRPCError)
  })

  it('throws TRPCError on non-2xx response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not found'),
    })

    await expect(
      fetchAndNormalizeRecipe('https://example.com/recipe', mockAIExtractor)
    ).rejects.toThrow(TRPCError)
  })

  it('throws TRPCError on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(
      fetchAndNormalizeRecipe('https://example.com/recipe', mockAIExtractor)
    ).rejects.toThrow(TRPCError)
  })

  it('throws TRPCError when AI response is not valid JSON', async () => {
    const html = `<html><body>No recipe</body></html>`

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    })

    vi.mocked(mockAIExtractor.extract).mockResolvedValue('not valid json')

    await expect(
      fetchAndNormalizeRecipe('https://example.com/recipe', mockAIExtractor)
    ).rejects.toThrow(TRPCError)
  })

  it('throws TRPCError when AI JSON fails schema validation', async () => {
    const html = `<html><body>No recipe</body></html>`

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    })

    vi.mocked(mockAIExtractor.extract).mockResolvedValue(
      JSON.stringify({ ingredients: [] })
    )

    await expect(
      fetchAndNormalizeRecipe('https://example.com/recipe', mockAIExtractor)
    ).rejects.toThrow(TRPCError)
  })

  it('truncates body text to 8000 chars before sending to extractor', async () => {
    const longText = 'a'.repeat(12000)
    const html = `<html><body>${longText}</body></html>`

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    })

    vi.mocked(mockAIExtractor.extract).mockResolvedValue(
      JSON.stringify({
        name: 'Recipe',
        ingredients: 'ingredient 1, ingredient 2',
        instructions: 'test',
      })
    )

    await fetchAndNormalizeRecipe(
      'https://example.com/recipe',
      mockAIExtractor
    )

    const call = vi.mocked(mockAIExtractor.extract).mock.calls[0][0]
    expect(call.userContent.length).toBeLessThanOrEqual(8000)
  })
})
