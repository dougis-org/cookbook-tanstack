# M08 Tasks

## 1. Environment & Dependencies

- [x] 1.1 Confirm no outbound email provider is required for launch scope
- [x] 1.2 Document deferred post-launch stream:
  contact form + outbound email features

## 2. Print Styles

- [x] 2.1 Create `src/styles/print.css` with `@media print` rules:
  `@page` margins, base font size (11pt+), black-on-white colours
- [x] 2.2 Import `print.css` in `src/routes/__root.tsx` alongside existing global styles
- [x] 2.3 Add `print:hidden` Tailwind class to `<Header>` component
- [x] 2.4 Add `print:hidden` to action buttons (edit, delete, export) on the recipe detail page
- [x] 2.5 Add `print:hidden` to filter sidebar and search bar on the recipe list page
- [x] 2.6 Add `page-break-inside: avoid` rules in `print.css` for ingredient items and instruction steps
- [x] 2.7 Scale recipe images to `max-width: 100%` in print context
- [x] 2.8 Ensure classification badge text labels are visible in black-and-white
  (remove background-only colour cues)
- [x] 2.9 Manually verify print preview in Chrome DevTools print simulation

## 3. Recipe Export

- [x] 3.1 Create `src/lib/export.ts` with a
  `exportRecipeToJson(recipe: Recipe): string` utility that produces
  pretty-printed JSON including all recipe fields plus `_version: "1"`
- [x] 3.2 Create `src/lib/download.ts` with a
  `downloadBlob(content: string, filename: string, mimeType: string)` utility that
  triggers a browser file download via a temporary `<a>` element
- [x] 3.3 Add an `ExportButton` component to `src/components/recipes/ExportButton.tsx`
  that calls `exportRecipeToJson` + `downloadBlob` on click, using data from
  the React Query cache
- [x] 3.4 Render `<ExportButton>` in the action area of `src/routes/recipes/$recipeId.tsx`
- [x] 3.5 Write unit tests for `exportRecipeToJson` (field inclusion, `_version` field, JSON validity)
- [x] 3.6 Write Playwright E2E test: click Export on a recipe, assert file download initiates

## 4. Recipe Import — Backend

- [x] 4.1 Extend `src/lib/validation.ts` with an `importedRecipeSchema` Zod schema matching the export JSON shape
- [x] 4.2 Add a `recipes.import` tRPC mutation in `src/server/trpc/routers/recipes.ts`
  that accepts validated import data and creates a new Recipe document in MongoDB
- [x] 4.3 Write unit tests for `importedRecipeSchema` (valid export JSON, missing fields, wrong types)
- [x] 4.4 Write unit tests for the `recipes.import` mutation (successful create, validation failure)

## 5. Recipe Import — Frontend

- [x] 5.1 Create route file `src/routes/import/index.tsx` with `Route` export and `ImportPage` component
- [x] 5.2 Create `src/components/recipes/ImportDropzone.tsx`:
  drag-and-drop + click-to-browse file upload accepting `.json` only,
  with rejection feedback for wrong file types
- [x] 5.3 On file selection, read contents, attempt `JSON.parse`,
  validate against `importedRecipeSchema`, and surface per-field errors
  if invalid
- [x] 5.4 Create `src/components/recipes/ImportPreviewModal.tsx` showing
  title, servings, difficulty, ingredient count, and a `_version` warning
  banner when version mismatches
- [x] 5.5 Wire the preview modal's Confirm button to the `recipes.import` tRPC mutation
- [x] 5.6 On successful import, close modal and navigate to the new recipe's detail page
- [x] 5.7 On server error, display the error in the modal and keep it open
- [x] 5.8 Add an "Import Recipe" link on the recipe list page and in the Header
  or recipe action area
- [x] 5.9 Write Vitest component tests for `ImportDropzone`
  (file rejection, valid file acceptance)
- [x] 5.10 Write Vitest component tests for `ImportPreviewModal` (version warning, confirm/cancel)
- [x] 5.11 Write Playwright E2E test: upload an exported JSON file,
  confirm import, verify redirect to new recipe

## 6. Serving Size Adjuster

- [x] 6.1 Create `src/lib/servings.ts` with a
  `scaleQuantity(quantity: string, factor: number): string` utility that handles
  numeric scaling (rounded to 2 dp) and passes through non-numeric strings unchanged
- [x] 6.2 Create `src/components/recipes/ServingSizeAdjuster.tsx` with `useState`
  for current servings, + / - buttons (- disabled at 1), and a Reset button
  hidden when at original servings
- [x] 6.3 Accept `originalServings: number` and `ingredients: Ingredient[]`
  as props; output scaled ingredients via a callback or context
- [x] 6.4 Integrate `ServingSizeAdjuster` into
  `src/components/recipes/RecipeDetail.tsx` so scaled quantities
  render in the ingredient list
- [x] 6.5 Write unit tests for `scaleQuantity` (numeric up, numeric down,
  non-numeric passthrough, irrational decimals)
- [x] 6.6 Write Vitest component tests for `ServingSizeAdjuster`
  (increment, decrement, reset, disable at min)
- [x] 6.7 Write Playwright E2E test: adjust servings on a recipe,
  verify ingredient quantities update, reset returns to original

## 7. Final QA

- [x] 7.1 Run `npm run test` - all unit and integration tests pass
- [x] 7.2 Run `npm run test:e2e` - all Playwright tests pass
- [x] 7.3 Run `npm run build` - production build succeeds with no TypeScript errors
- [x] 7.4 Manually verify print preview for recipe detail and recipe list in Chrome
- [x] 7.5 Manually verify export -> import round-trip: export a recipe, import the JSON, confirm the new recipe matches
