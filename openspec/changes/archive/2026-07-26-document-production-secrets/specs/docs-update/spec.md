## ADDED Requirements

### Requirement: Production secrets and env vars documented in ci-cd.md

The system SHALL document, in a `## Production Secrets & Environment Variables` section of `docs/standards/ci-cd.md`, every production secret/environment variable found in `.env.example`, `fly.toml`, `.github/workflows/deploy.yml`, and `.github/workflows/build-and-test.yml`, with columns for variable name, where it is set, what depends on it, and when it needs to change.

#### Scenario: Every known production var appears in the table

- **Given** `docs/standards/ci-cd.md` is opened
- **When** the "Production Secrets & Environment Variables" section is read
- **Then** a table row exists for each of: `APP_PRIMARY_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, `BETTER_AUTH_SECRET`, `MONGODB_URI`, `MAILTRAP_API_TOKEN`, `MAIL_FROM`, `IMAGE_KIT_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, all six `STRIPE_PRICE_*` vars, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_GOOGLE_ANALYTICS_ID`, all three `VITE_GOOGLE_ADSENSE_*_SLOT_ID` vars, `VITE_ADSENSE_ENABLED`, `FLY_API_TOKEN`, `CODACY_API_TOKEN`, `PORT`, and `NODE_ENV`

#### Scenario: Storage-location categories are defined once

- **Given** the new section
- **When** a reader looks for what "Fly secret" vs "GH Actions Variable" means
- **Then** the four storage-location categories (Fly secret, Fly `[env]`, GitHub Actions secret, GitHub Actions Variable) are each defined with their runtime/build-time semantics before the table, so individual rows don't need to re-explain them

### Requirement: High-risk vars have documented failure modes

The system SHALL include a `### What Breaks If Wrong` subsection describing the concrete failure mode for production secrets whose failure is silent, ambiguous, or high-blast-radius: `APP_PRIMARY_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, `BETTER_AUTH_SECRET`, `MONGODB_URI`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `VITE_STRIPE_PUBLISHABLE_KEY`, `MAILTRAP_API_TOKEN`/`MAIL_FROM`, `IMAGE_KIT_API_KEY`, `FLY_API_TOKEN`, and `CODACY_API_TOKEN`.

#### Scenario: Silent-failure vars are called out explicitly

- **Given** the "What Breaks If Wrong" subsection
- **When** the `STRIPE_WEBHOOK_SECRET` entry is read
- **Then** it states that a wrong value causes webhook signature verification to fail without a visible error in the app, and that Stripe's dashboard shows this differently than the app experiences it, so subscription state can silently drift

#### Scenario: High-blast-radius vars are flagged as such

- **Given** the "What Breaks If Wrong" subsection
- **When** the `BETTER_AUTH_URL` entry is read
- **Then** it states that a wrong value breaks session cookie issuance for all users simultaneously, distinguishing it from lower-blast-radius vars

#### Scenario: Selective coverage is explained, not silent

- **Given** the "What Breaks If Wrong" subsection
- **When** a reader notices `PORT`, `NODE_ENV`, and the `VITE_GOOGLE_*` vars have no risk-detail entry
- **Then** an introductory sentence in the subsection explains that self-evident failure modes (immediate, loud, low-ambiguity) are intentionally excluded from prose detail, so the omission does not read as an oversight

### Requirement: Non-APP_PRIMARY_URL-driven domain strings are flagged

The system SHALL document, in the new section, that `mycookbooks.app` (hardcoded in `src/emails/Layout.tsx`) and `mycookbooks.com` (hardcoded in `src/routes/privacy-policy.tsx`) are not derived from `APP_PRIMARY_URL` and will not update automatically on a domain rotation.

#### Scenario: Domain rotation reader is warned about hardcoded strings

- **Given** the new section
- **When** a reader is planning a future `APP_PRIMARY_URL` rotation
- **Then** they can find an explicit note that `mycookbooks.app` and `mycookbooks.com` are separate hardcoded values requiring their own code changes

### Requirement: VITE_STRIPE_PUBLISHABLE_KEY documents intended location, not a settled fix

The system SHALL document `VITE_STRIPE_PUBLISHABLE_KEY`'s intended storage location (a GitHub Actions Variable passed via `--build-arg`, per the existing `VITE_GOOGLE_*`/`VITE_ADSENSE_*` pattern in `deploy.yml`) and explicitly link #635 as an open, unresolved gap, without waiting for #635 to be fixed before this documentation ships.

#### Scenario: Row states intended location, not confirmed-working status

- **Given** the "Production Secrets & Environment Variables" table
- **When** the `VITE_STRIPE_PUBLISHABLE_KEY` row is read
- **Then** it states the intended storage location (GitHub Actions Variable, `--build-arg`) and references #635 as an open issue tracking the current gap — it does not claim the variable is confirmed working in production today

### Requirement: .env.example production domain comment is current

The system SHALL update the `APP_PRIMARY_URL` comment in `.env.example` to reflect the canonical production domain as of the most recently merged domain migration, replacing any stale prior domain reference.

#### Scenario: .env.example matches the documented canonical domain

- **Given** `.env.example` is opened
- **When** the `APP_PRIMARY_URL` comment is read
- **Then** it references the same canonical domain value as the "Production Secrets & Environment Variables" section in `docs/standards/ci-cd.md`, with no reference to a superseded domain

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal "In Scope: new section in docs/standards/ci-cd.md" -> Requirement: Production secrets and env vars documented in ci-cd.md
- Proposal "In Scope: What Breaks If Wrong subsection" -> Requirement: High-risk vars have documented failure modes
- Proposal "In Scope: flag mycookbooks.app/mycookbooks.com" -> Requirement: Non-APP_PRIMARY_URL-driven domain strings are flagged
- Proposal "In Scope: correct .env.example stale comment" -> Requirement: .env.example production domain comment is current
- Design decision "Selective risk-detail coverage" -> Requirement: High-risk vars have documented failure modes (selective-coverage scenario)
- Requirements -> Tasks: doc section write-up, .env.example correction

## Non-Functional Acceptance Criteria

### Requirement: Performance

Not applicable — documentation-only change with no runtime impact.

### Requirement: Security

The system SHALL NOT include actual secret values (tokens, keys, URIs with credentials) anywhere in the new documentation — only variable names, storage locations, and behavioral descriptions.

#### Scenario: No real secret values appear in the doc

- **Given** the new "Production Secrets & Environment Variables" section
- **When** it is reviewed before merge
- **Then** no cell or prose paragraph contains an actual production credential, token, or connection string value

### Requirement: Reliability

#### Scenario: Doc reflects merged state for settled values

- **Given** #632 (domain migration) has merged via PR #638
- **When** this change's tasks reach the doc-writing step
- **Then** `APP_PRIMARY_URL`, `BETTER_AUTH_URL`, and `BETTER_AUTH_TRUSTED_ORIGINS` rows reflect #638's merged values, not any prior in-progress value

#### Scenario: Doc does not wait on unresolved implementation gaps

- **Given** #635 (`VITE_STRIPE_PUBLISHABLE_KEY` build-arg gap) is still open and expected to remain open for some time
- **When** this change's tasks reach the doc-writing step
- **Then** the doc-writing step proceeds without waiting for #635 to close, documenting the intended value and the open gap per the "VITE_STRIPE_PUBLISHABLE_KEY documents intended location" requirement above
