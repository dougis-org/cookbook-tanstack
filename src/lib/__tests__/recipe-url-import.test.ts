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
})
