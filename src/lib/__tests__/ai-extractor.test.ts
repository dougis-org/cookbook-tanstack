import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createAnthropicExtractor } from '../ai-extractor'

vi.mock('@anthropic-ai/sdk', () => {
  const mockClient = {
    messages: {
      create: vi.fn(),
    },
  }
  return {
    default: class {
      messages = mockClient.messages
    },
  }
})

describe('AIExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws if ANTHROPIC_API_KEY is missing', () => {
    const original = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY

    expect(() => createAnthropicExtractor()).toThrow(/ANTHROPIC_API_KEY/)

    if (original) process.env.ANTHROPIC_API_KEY = original
  })

  it('extracts text from first content block', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const mockCreate = vi.mocked(new Anthropic().messages.create)

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'extracted recipe' }],
    } as any)

    const extractor = createAnthropicExtractor()
    const result = await extractor.extract({
      systemPrompt: 'You are a recipe extractor.',
      userContent: '<html>...</html>',
      maxOutputTokens: 1024,
    })

    expect(result).toBe('extracted recipe')
  })

  it('sends cache_control on system prompt', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const mockCreate = vi.mocked(new Anthropic().messages.create)

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'result' }],
    } as any)

    const extractor = createAnthropicExtractor()
    await extractor.extract({
      systemPrompt: 'You are a recipe extractor.',
      userContent: 'content',
      maxOutputTokens: 1024,
    })

    const callArgs = mockCreate.mock.calls[0][0]
    expect(callArgs.system).toEqual(
      expect.objectContaining({
        type: 'text',
        cache_control: { type: 'ephemeral' },
      })
    )
  })

  it('passes maxOutputTokens as max_tokens in request', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const mockCreate = vi.mocked(new Anthropic().messages.create)

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'result' }],
    } as any)

    const extractor = createAnthropicExtractor()
    await extractor.extract({
      systemPrompt: 'system',
      userContent: 'content',
      maxOutputTokens: 512,
    })

    const callArgs = mockCreate.mock.calls[0][0]
    expect(callArgs.max_tokens).toBe(512)
  })

  it('uses claude-haiku-4-5-20251001 model', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const mockCreate = vi.mocked(new Anthropic().messages.create)

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'result' }],
    } as any)

    const extractor = createAnthropicExtractor()
    await extractor.extract({
      systemPrompt: 'system',
      userContent: 'content',
      maxOutputTokens: 1024,
    })

    const callArgs = mockCreate.mock.calls[0][0]
    expect(callArgs.model).toBe('claude-haiku-4-5-20251001')
  })

  it('propagates SDK errors', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key'

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const mockCreate = vi.mocked(new Anthropic().messages.create)

    const testError = new Error('API error')
    mockCreate.mockRejectedValueOnce(testError)

    const extractor = createAnthropicExtractor()

    await expect(
      extractor.extract({
        systemPrompt: 'system',
        userContent: 'content',
        maxOutputTokens: 1024,
      })
    ).rejects.toThrow('API error')
  })
})
