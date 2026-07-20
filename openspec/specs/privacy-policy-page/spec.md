## ADDED Requirements

### Requirement: Privacy policy route resolves
The system SHALL serve a `/privacy-policy` route that renders privacy policy content, without requiring authentication.

#### Scenario: Unauthenticated visitor loads the page
- **WHEN** any visitor (authenticated or not) navigates to `/privacy-policy`
- **THEN** the route renders the privacy policy content instead of a 404

#### Scenario: Registration link resolves
- **WHEN** a visitor on the registration screen clicks the "Privacy Policy" link
- **THEN** the app navigates client-side (via `<Link>`, not a full page reload) to `/privacy-policy` and renders content

### Requirement: Policy content is organized into collapsible sections
The privacy policy page SHALL present its content as a single flat page divided into independently collapsible sections, built on the shared `Accordion` component.

#### Scenario: Sections render collapsed or expanded independently
- **WHEN** the page loads
- **THEN** each of the five sections (Your Account, Your Recipes & Cookbooks, Billing, Third-Party Sharing, Changes to This Policy) is rendered as an independent, keyboard-accessible disclosure that can be opened or closed without affecting the state of other sections

### Requirement: Policy content covers current and forward-looking data handling
The privacy policy SHALL truthfully describe: Better-Auth account data, user-generated recipe/cookbook content, Stripe billing data, transactional email, and third-party OAuth account-linking data sharing (including the scope granted, what is explicitly not shared, and that access is user-revocable).

#### Scenario: Third-party sharing section names the OAuth scope and its limits
- **WHEN** a reader expands the "Third-Party Sharing" section
- **THEN** the content states that a connected client (e.g. Alexa) receives only a read-only `read:own-content` scope, and explicitly states that password, email, and payment data are never shared with a connected client (distinct from the transactional email address shared with the app's own email service provider, described separately)

#### Scenario: Revocability is stated and traceable
- **WHEN** a reader expands the "Third-Party Sharing" section
- **THEN** the content states that account linking can be revoked by the user at any time

### Requirement: Policy page follows the design system
The privacy policy page SHALL use only theme-token colors (no hardcoded hex values), Lucide icons, and the established type scale, and SHALL remain legible across all four supported themes.

#### Scenario: Page renders legibly in every theme
- **WHEN** the active theme is `dark`, `dark-greens`, `light-cool`, or `light-warm`
- **THEN** all text and section chrome on `/privacy-policy` remain readable with sufficient contrast in each theme
