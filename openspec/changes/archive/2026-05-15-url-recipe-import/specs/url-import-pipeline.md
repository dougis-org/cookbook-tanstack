## ADDED Requirements

### Requirement: fetchAndNormalizeRecipe

The system SHALL export `fetchAndNormalizeRecipe(url: string, extractor: AIExtractor): Promise<ImportedRecipeInput>` from `src/lib/recipe-url-import.ts`.

---

#### Scenario: Schema.org path — valid ld+json present

- **Given** the URL returns HTML containing a valid Schema.org `Recipe` `ld+json` block
- **When** `fetchAndNormalizeRecipe` is called
- **Then** returns `ImportedRecipeInput` with fields mapped from the Schema.org data
- **And** `extractor.extract` is NOT called

#### Scenario: Schema.org path — multiple ld+json blocks, first valid Recipe used

- **Given** the HTML contains multiple `<script type="application/ld+json">` blocks and the first `@type: "Recipe"` block is valid
- **When** `fetchAndNormalizeRecipe` is called
- **Then** returns `ImportedRecipeInput` from that block; extractor not called

#### Scenario: AI fallback — no Schema.org Recipe present

- **Given** the URL returns HTML with no `ld+json` block of `@type: "Recipe"`
- **When** `fetchAndNormalizeRecipe` is called
- **Then** HTML body text is truncated to ≤8000 chars and passed to `extractor.extract`
- **And** returns `ImportedRecipeInput` parsed from the extractor's JSON response

#### Scenario: AI fallback — Schema.org present but fails importedRecipeSchema validation

- **Given** the `ld+json` block is syntactically valid JSON but missing the required `name` field
- **When** `fetchAndNormalizeRecipe` is called
- **Then** falls through to AI fallback (Schema.org failure is not a terminal error)

#### Scenario: isPublic always true

- **Given** any successful extraction path (Schema.org or AI)
- **When** `fetchAndNormalizeRecipe` returns
- **Then** the returned `ImportedRecipeInput` has `isPublic: true`

---

#### Scenario: fetch timeout — URL does not respond within 5 seconds

- **Given** the URL does not respond before the 5-second timeout
- **When** `fetchAndNormalizeRecipe` is called
- **Then** throws `TRPCError` with a user-readable message (e.g., "The URL timed out. Try again or use file import.")

#### Scenario: fetch error — non-2xx response

- **Given** the URL returns a 4xx or 5xx HTTP status
- **When** `fetchAndNormalizeRecipe` is called
- **Then** throws `TRPCError` with a user-readable message including the status code

#### Scenario: fetch error — network failure

- **Given** the URL cannot be reached (DNS failure, connection refused, etc.)
- **When** `fetchAndNormalizeRecipe` is called
- **Then** throws `TRPCError` with a user-readable message

#### Scenario: AI response fails importedRecipeSchema validation

- **Given** the extractor returns JSON that does not pass `importedRecipeSchema` (e.g., missing `name`)
- **When** `fetchAndNormalizeRecipe` is called
- **Then** throws `TRPCError` listing the validation failures from `zod.issues`

#### Scenario: AI response is not valid JSON

- **Given** the extractor returns a string that is not parseable as JSON
- **When** `fetchAndNormalizeRecipe` is called
- **Then** throws `TRPCError` with a message indicating extraction failed

---

### Requirement: HTML body truncation

The system SHALL truncate the extracted HTML body text to ≤8000 characters before passing it to `AIExtractor.extract`.

#### Scenario: body text longer than 8000 chars is truncated

- **Given** the HTML body text is 12000 characters
- **When** it is passed to `extractor.extract`
- **Then** `userContent` is ≤8000 characters
