## ADDED Requirements

### Requirement: RecipeCard image container hidden when no image
The `RecipeCard` component SHALL NOT render the image container when `recipe.imageUrl` is absent (null, undefined, or empty string). No placeholder text or empty space SHALL be shown in place of the image.

#### Scenario: Card with no imageUrl renders without image area
- **WHEN** `RecipeCard` renders with `recipe.imageUrl` absent or falsy
- **THEN** no image container element is present in the DOM
- **THEN** no "No Image" placeholder text is rendered
- **THEN** the card content (name, notes, meta) appears directly below the card top edge

#### Scenario: Card with imageUrl renders image normally
- **WHEN** `RecipeCard` renders with a truthy `recipe.imageUrl`
- **THEN** an `<img>` element is rendered inside the fixed-height container
- **THEN** the image fills the container with `object-cover`

---

### Requirement: RecipeDetail image section hidden when no image
The `RecipeDetail` component SHALL NOT render the header image section when `recipe.imageUrl` is absent. No placeholder text or empty vertical space SHALL appear at the top of the detail view.

#### Scenario: Detail view with no imageUrl renders without image section
- **WHEN** `RecipeDetail` renders with `recipe.imageUrl` absent or falsy
- **THEN** no image section element is present in the DOM
- **THEN** no "No Image Available" placeholder text is rendered
- **THEN** the recipe title heading is the first visible element inside the card

#### Scenario: Detail view with imageUrl renders image normally
- **WHEN** `RecipeDetail` renders with a truthy `recipe.imageUrl`
- **THEN** an `<img>` element is rendered at the top of the detail card
- **THEN** the image occupies the full header height (`h-96`)
