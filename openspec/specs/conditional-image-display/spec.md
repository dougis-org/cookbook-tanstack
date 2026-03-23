## ADDED Requirements

### Requirement: CardImage component renders only when src is truthy
The `CardImage` component (`src/components/ui/CardImage.tsx`) SHALL render nothing when `src` is absent (null, undefined, or empty string). When `src` is truthy it SHALL render a container `<div>` (styled via the `className` prop) containing an `<img>` with `object-cover` sizing.

#### Scenario: No src — nothing rendered
- **WHEN** `CardImage` renders with `src` absent or falsy
- **THEN** no DOM element is rendered (component returns null)

#### Scenario: Truthy src — container and image rendered
- **WHEN** `CardImage` renders with a truthy `src`
- **THEN** a container `<div>` is rendered with the provided `className`
- **THEN** an `<img>` element with `object-cover` is rendered inside the container

---

### Requirement: RecipeCard uses CardImage for conditional image display
`RecipeCard` SHALL use `CardImage` for its image area. No image container SHALL render when `recipe.imageUrl` is absent.

#### Scenario: Card with no imageUrl renders without image area
- **WHEN** `RecipeCard` renders with `recipe.imageUrl` absent or falsy
- **THEN** no image container element is present in the DOM
- **THEN** the card content appears directly below the card top edge

#### Scenario: Card with imageUrl renders image via CardImage
- **WHEN** `RecipeCard` renders with a truthy `recipe.imageUrl`
- **THEN** `CardImage` renders the `h-48` container and `<img>`

---

### Requirement: RecipeDetail uses CardImage for conditional image display
`RecipeDetail` SHALL use `CardImage` for its header image area. No image section SHALL render when `recipe.imageUrl` is absent.

#### Scenario: Detail view with no imageUrl renders without image section
- **WHEN** `RecipeDetail` renders with `recipe.imageUrl` absent or falsy
- **THEN** no image section element is present in the DOM
- **THEN** the recipe title heading is the first visible element inside the card

#### Scenario: Detail view with imageUrl renders image via CardImage
- **WHEN** `RecipeDetail` renders with a truthy `recipe.imageUrl`
- **THEN** `CardImage` renders the `h-96` container and `<img>`

---

### Requirement: CookbookCard image header hidden when no image; BookOpen icon inline with title
`CookbookCard` SHALL use `CardImage` for its `h-40` header. When `imageUrl` is absent, the header SHALL not render and the `BookOpen` icon SHALL appear inline to the left of the cookbook title in the card body. The Private badge SHALL always render in the card body regardless of image state.

#### Scenario: Card with no imageUrl — no header, icon in title
- **WHEN** `CookbookCard` renders with `imageUrl` absent or falsy
- **THEN** no `h-40` image container is present in the DOM
- **THEN** the `BookOpen` icon is rendered inline within the title element
- **THEN** no grey placeholder background occupies the top of the card

#### Scenario: Card with imageUrl — header rendered, no inline icon
- **WHEN** `CookbookCard` renders with a truthy `imageUrl`
- **THEN** `CardImage` renders the `h-40` image header
- **THEN** the `BookOpen` icon is NOT rendered inline with the title

#### Scenario: Private badge always visible in card body
- **WHEN** `CookbookCard` renders with `isPublic` false
- **THEN** a "Private" badge is visible in the card body regardless of whether `imageUrl` is set

---

### Requirement: CategoryCard renders no image area
`CategoryCard` SHALL NOT render any image container or placeholder. The `Classification` type has no `imageUrl` field; no image is ever possible. The card SHALL render only the title, optional description, and recipe count.

#### Scenario: Category card renders without any image area
- **WHEN** `CategoryCard` renders with any `ClassificationWithCount` value
- **THEN** no image container or "No Image" text is present in the DOM
- **THEN** the category name heading is the first visible element inside the card

---

### Requirement: Cookbook recipe row thumbnail hidden when no image
In the cookbook detail recipe list, the `h-12 w-12` thumbnail SHALL NOT render when `recipe.imageUrl` is absent.

#### Scenario: Recipe row with no imageUrl — no thumbnail
- **WHEN** a recipe row in the cookbook detail list renders with `imageUrl` absent or falsy
- **THEN** no thumbnail container is present in the DOM for that row

#### Scenario: Recipe row with imageUrl — thumbnail rendered
- **WHEN** a recipe row renders with a truthy `imageUrl`
- **THEN** `CardImage` renders the `h-12 w-12` thumbnail with the recipe image

---

### Requirement: Cookbook recipe picker thumbnail hidden when no image
In the cookbook detail add-recipe picker, the `h-10 w-10` thumbnail SHALL NOT render when `recipe.imageUrl` is absent.

#### Scenario: Picker row with no imageUrl — no thumbnail
- **WHEN** a recipe row in the add-recipe picker renders with `imageUrl` absent or falsy
- **THEN** no thumbnail container is present in the DOM for that row

#### Scenario: Picker row with imageUrl — thumbnail rendered
- **WHEN** a picker row renders with a truthy `imageUrl`
- **THEN** `CardImage` renders the `h-10 w-10` thumbnail with the recipe image
