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

#### Scenario: Doc reflects merged state, not in-flight state

- **Given** #632 (domain migration) and #635 (Stripe publishable key) are both still open
- **When** this change's tasks reach the doc-writing step
- **Then** the doc-writing step is blocked from proceeding until both referenced issues are confirmed merged/resolved, per the gating task in `tasks.md`
