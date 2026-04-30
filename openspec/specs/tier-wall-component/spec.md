## Requirements

### Requirement: TierWall component — inline display

The system SHALL render a compact inline upgrade prompt suitable for placement adjacent to a disabled button or toggle.

#### Scenario: Inline TierWall shows correct message for count-limit

- **Given** a component renders `<TierWall reason="count-limit" display="inline" />`
- **When** the component mounts
- **Then** the text describes the applicable recipe or cookbook count limit and includes a link to `/pricing`

#### Scenario: Inline TierWall shows correct message for private-content

- **Given** a component renders `<TierWall reason="private-content" display="inline" />`
- **When** the component mounts
- **Then** the text explains that private content requires sous-chef tier or above and includes a link to `/pricing`

#### Scenario: Inline TierWall shows correct message for import

- **Given** a component renders `<TierWall reason="import" display="inline" />`
- **When** the component mounts
- **Then** the text explains that recipe import requires sous-chef tier or above and includes a link to `/pricing`

### Requirement: TierWall component — modal display

The system SHALL render a dismissible modal overlay with the tier-wall message and a primary CTA linking to `/pricing`.

#### Scenario: Modal TierWall can be dismissed

- **Given** a component renders `<TierWall reason="count-limit" display="modal" onDismiss={fn} />`
- **When** the user clicks the dismiss/close button
- **Then** `onDismiss` is called once

#### Scenario: Modal TierWall /pricing link is present

- **Given** a component renders `<TierWall reason="count-limit" display="modal" onDismiss={fn} />`
- **When** the component mounts
- **Then** a link pointing to `/pricing` is rendered and accessible

#### Scenario: Modal TierWall is shown after server PAYMENT_REQUIRED

- **Given** a user submits a recipe create form and the mutation returns `PAYMENT_REQUIRED` with `appError.reason === 'count-limit'`
- **When** the `onError` handler processes the tRPC error
- **Then** a modal TierWall with `reason="count-limit"` is rendered

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: TierWall renders without crash when tier is unknown

- **Given** `TierWall` is rendered with a valid `reason` and `display` but the parent session is null
- **When** the component mounts
- **Then** it renders without throwing (shows generic upgrade message)

### Requirement: Security

#### Scenario: TierWall is purely presentational — no server calls

- **Given** a TierWall component is rendered
- **When** it mounts or the user interacts with it
- **Then** no tRPC mutations or server requests are made by the component itself
