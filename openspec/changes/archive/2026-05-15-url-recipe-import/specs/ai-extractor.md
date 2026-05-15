## ADDED Requirements

### Requirement: AIExtractor interface

The system SHALL export an `AIExtractor` interface from `src/lib/ai-extractor.ts` with a single method:

```ts
interface AIExtractor {
  extract(opts: {
    systemPrompt: string
    userContent: string
    maxOutputTokens: number
  }): Promise<string>
}
```

---

### Requirement: AnthropicExtractor class

The system SHALL export `AnthropicExtractor implements AIExtractor` using `@anthropic-ai/sdk`.

#### Scenario: returns text from model response

- **Given** a valid `systemPrompt` and `userContent`
- **When** `extract` is called
- **Then** returns the text content of the first content block from the Anthropic API response

#### Scenario: system prompt is cached

- **Given** `AnthropicExtractor` is constructed and `extract` is called
- **When** the Anthropic API request is made
- **Then** the system message includes `cache_control: { type: "ephemeral" }` on the system prompt block

#### Scenario: output token limit is passed through

- **Given** `extract` is called with `maxOutputTokens: 1024`
- **When** the Anthropic API request is made
- **Then** the request `max_tokens` equals `1024`

#### Scenario: model is claude-haiku-4-5-20251001

- **Given** `AnthropicExtractor` is used without model override
- **When** the Anthropic API request is made
- **Then** the request `model` is `"claude-haiku-4-5-20251001"`

#### Scenario: API error is propagated

- **Given** the Anthropic SDK throws a network or API error
- **When** `extract` is called
- **Then** the error propagates to the caller (not swallowed)

---

### Requirement: createAnthropicExtractor factory

The system SHALL export `createAnthropicExtractor(): AnthropicExtractor`.

#### Scenario: throws if ANTHROPIC_API_KEY is missing

- **Given** `ANTHROPIC_API_KEY` is not set in the environment
- **When** `createAnthropicExtractor()` is called
- **Then** throws an `Error` with a message indicating the missing key
