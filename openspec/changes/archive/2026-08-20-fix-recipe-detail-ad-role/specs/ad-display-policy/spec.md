## MODIFIED Requirements

### Requirement: MODIFIED Page Layout Policy

The system SHALL distinguish page roles so ad display can be controlled without hard-coding ad decisions into each
route component. Every render branch of a public-content route MUST assign its page-eligible role explicitly,
independent of `PageLayout`'s default role, so that no branch of a public route silently falls back to a
protected-task role.

#### Scenario: Public content page allows ad policy evaluation

- **Given** an anonymous visitor on a public recipe, cookbook, or discovery page
- **When** the page layout evaluates its role
- **Then** the layout can determine whether the page supports ad slots

#### Scenario: Protected task page suppresses ads

- **Given** any viewer on an auth, create, import, edit, admin, account/profile, or print surface
- **When** the page layout evaluates ad eligibility
- **Then** ads are not eligible to render

#### Scenario: Recipe detail page assigns its public-content role on every render branch

- **Given** the recipe detail route (`/recipes/$recipeId`) in any of its render states — loading, not-found, or
  loaded
- **When** that render branch constructs its page layout
- **Then** the layout is given the `public-content` role explicitly, matching the recipe list page's role
  assignment, rather than relying on `PageLayout`'s default role

## Traceability

- Proposal element -> Requirement: recipe detail page must assign `public-content` role on every render branch so
  anonymous visitors are ad-eligible -> MODIFIED Page Layout Policy, new scenario "Recipe detail page assigns its
  public-content role on every render branch".
- Requirement -> Task(s): see `tasks.md`; validation in `tests.md`.
