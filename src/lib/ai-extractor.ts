import Anthropic from '@anthropic-ai/sdk'

export interface AIExtractor {
  extract(opts: {
    systemPrompt: string
    userContent: string
    maxOutputTokens: number
  }): Promise<string>
}

export class AnthropicExtractor implements AIExtractor {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async extract(opts: {
    systemPrompt: string
    userContent: string
    maxOutputTokens: number
  }): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: opts.maxOutputTokens,
      system: {
        type: 'text',
        text: opts.systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
      messages: [
        {
          role: 'user',
          content: opts.userContent,
        },
      ],
    })

    const firstBlock = response.content[0]
    if (!firstBlock || firstBlock.type !== 'text') {
      throw new Error('No text content in response')
    }

    return firstBlock.text
  }
}

export function createAnthropicExtractor(): AnthropicExtractor {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }
  return new AnthropicExtractor(apiKey)
}
