## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: Terms of Service route resolves

The system SHALL serve a `/terms` route that renders Terms of Service content, without requiring authentication.

#### Scenario: Unauthenticated visitor loads the page

- **Given** any visitor, authenticated or not
- **When** they navigate to `/terms`
- **Then** the route renders Terms of Service content instead of a 404

#### Scenario: Registration link resolves

- **Given** a visitor on the registration screen
- **When** they click the "Terms" link
- **Then** the app navigates client-side (via `<Link>`, not a full page reload) to `/terms` and renders content

### Requirement: Content is organized into collapsible sections

The Terms of Service page SHALL present its content as a single flat page divided into independently collapsible sections, built on the shared `Accordion` component.

#### Scenario: Sections render collapsed or expanded independently

- **Given** the page has loaded
- **When** a reader opens one section (e.g. "Billing & Subscriptions")
- **Then** that section expands via the shared `Accordion` component's native `<details>/<summary>` disclosure
- **And** the state of the other seven sections (Your Account, Your Content, Acceptable Use, Third-Party Connections, Termination, Disclaimers, Changes to These Terms) is unaffected

### Requirement: Terms content covers required topics

The Terms of Service SHALL describe: account eligibility/responsibility, ownership and licensing of user-generated recipe/cookbook content, acceptable use, Stripe-based tier/billing terms, third-party (OAuth) connections, account termination, and liability/warranty disclaimers.

#### Scenario: Billing section names the payment processor and renewal behavior

- **Given** a reader expands the "Billing & Subscriptions" section
- **When** they read the content
- **Then** the content states that paid tiers are billed through Stripe
- **And** the content states that subscriptions renew automatically until cancelled

#### Scenario: Content section states ownership and license scope

- **Given** a reader expands the "Your Content" section
- **When** they read the content
- **Then** the content states that the user retains ownership of recipes/cookbooks they create
- **And** the content states that My CookBooks receives only a limited license to store, display, and process that content to operate the service

#### Scenario: Third-party section cross-references the privacy policy instead of duplicating it

- **Given** a reader expands the "Third-Party Connections" section
- **When** they read the content
- **Then** the content states that connecting a client (e.g. Alexa) uses a read-only, revocable, consent-based OAuth connection
- **And** the content links to `/privacy-policy` for the specific data-sharing scope and limits, rather than restating them
- **And** the content does not name a governing law, jurisdiction, or arbitration process (explicitly out of scope per this change's proposal)

### Requirement: Terms page follows the design system

The Terms of Service page SHALL use only theme-token colors (no hardcoded hex values), Lucide icons where icons are used, and the established type scale, and SHALL remain legible across all four supported themes.

#### Scenario: Page renders legibly in every theme

- **Given** the active theme is `dark`, `dark-greens`, `light-cool`, or `light-warm`
- **When** a reader views `/terms`
- **Then** all text and section chrome remain readable with sufficient contrast in each theme

## Traceability

- Proposal element "New `/terms` route" -> Requirement: "Terms of Service route resolves"
- Proposal element "ToS content covering 8 named topics" -> Requirement: "Terms content covers required topics"
- Proposal element "RegisterForm.tsx `<a>` to `<Link>` swap" -> Requirement: "Terms of Service route resolves" (scenario: registration link resolves)
- Design decision 1 (route mirrors `/privacy-policy`) -> Requirement: "Terms of Service route resolves", "Content is organized into collapsible sections"
- Design decision 3 (cross-link, not restate) -> Requirement: "Terms content covers required topics" (scenario: third-party section cross-references)
- Design decision 4 (`RegisterForm.tsx` link swap) -> Requirement: "Terms of Service route resolves" (scenario: registration link resolves)
- Requirement "Terms of Service route resolves" -> Task(s): route creation, RegisterForm link update (see tasks.md)
- Requirement "Content is organized into collapsible sections" -> Task(s): route creation (SECTIONS array using AccordionItem[])
- Requirement "Terms content covers required topics" -> Task(s): content drafting/finalization
- Requirement "Terms page follows the design system" -> Task(s): visual QA across themes

## Non-Functional Acceptance Criteria

> NFAC scenarios below do not duplicate the functional scenarios above.

### Requirement: Security

The `/terms` route SHALL NOT require or expose authenticated session state.

#### Scenario: Public access without session-gated content

See functional scenario: "Unauthenticated visitor loads the page" — no additional distinct security property beyond public accessibility applies to this static-content route.
