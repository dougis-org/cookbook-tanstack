## MODIFIED Requirements

### Requirement: MODIFIED Application Branding

The system SHALL present the brand name as "My CookBooks" across all primary UI surfaces and browser metadata.

#### Scenario: Header Logo
- **Given** the user is on any page of the application
- **When** the header is rendered
- **Then** the logo text SHALL be "My CookBooks" and it SHALL use the Fraunces font with the branded gradient.

#### Scenario: Browser Tab Title
- **Given** the user navigates to the landing page
- **When** the page loads
- **Then** the document title SHALL start with "My CookBooks".

#### Scenario: Home Page Hero
- **Given** a guest is on the public landing page
- **When** the hero section is visible
- **Then** the main heading SHALL display "My CookBooks" in the branded gradient.

### Requirement: MODIFIED Global Typography

The system SHALL use the brand-specific font families for display and body text.

#### Scenario: Font Application
- **Given** a page containing an `<h1>` element
- **When** the styles are applied
- **Then** the `<h1>` element SHALL have a `font-family` that includes "Fraunces".

## REMOVED Requirements

### Requirement: REMOVED Generic "CookBook" Branding
- **Reason for removal:** Replaced by the more personalized and engaging "My CookBooks" identity to drive user retention.

## Traceability

- **Proposal element:** Update "CookBook" text -> **Requirement:** MODIFIED Application Branding
- **Design decision:** Decision 1 (Text-based wordmark) -> **Requirement:** MODIFIED Application Branding (Scenario: Header Logo)
- **Design decision:** Decision 2 (Typography implementation) -> **Requirement:** MODIFIED Global Typography

## Non-Functional Acceptance Criteria

### Requirement: Performance (Font Loading)

#### Scenario: Largest Contentful Paint (LCP) Impact
- **Given** a standard 4G connection
- **When** the home page is loaded
- **Then** the LCP SHALL not increase by more than 200ms due to external font loading.

### Requirement: Operability (Responsive Design)

#### Scenario: Mobile Header Integrity
- **Given** a mobile viewport (375px width)
- **When** the header is rendered
- **Then** the "My CookBooks" title SHALL NOT overlap the user profile menu or search trigger, and it SHALL NOT cause a horizontal scrollbar.
