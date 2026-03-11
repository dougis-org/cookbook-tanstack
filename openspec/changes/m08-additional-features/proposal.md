## Why

The core recipe and cookbook management features (M01-M05) are complete, but the application lacks essential utility features that turn it from a functional prototype into a polished, usable product: clean printing, the ability to move recipe data in and out, and on-page serving adjustment. These additions directly close the gap between the current state and a launch-ready application while keeping scope aligned to a single delivery stream.

## What Changes

- **Print styles** — `@media print` stylesheet applied globally, hiding navigation and UI chrome, formatting recipe detail and list pages cleanly for paper output
- **Recipe JSON export** — "Export" button on the recipe detail page triggers a browser download of the recipe as a structured `.json` file
- **Recipe JSON import** — new `/import` page with drag-and-drop file upload, JSON parse + validation, preview modal, and create-on-confirm flow
- **Serving size adjuster** — interactive +/− controls on the recipe detail page that proportionally scale all ingredient quantities in real time (no persistence required)

Authentication-dependent features from M08 (email notification preferences, per-user recipe notes) are deferred until Better-Auth is added.
Contact form and email delivery are also deferred to post-launch so outbound email can be implemented in a dedicated follow-up stream.

## Capabilities

### New Capabilities

- `print-styles`: Global `@media print` styles that suppress navigation and format recipe detail and list pages for paper
- `recipe-export`: JSON export of a single recipe as a browser-downloadable file from the recipe detail page
- `recipe-import`: JSON import page with file upload, parse/validate, preview, and create flow
- `serving-size-adjuster`: Client-side ingredient quantity scaling component on the recipe detail page

### Modified Capabilities

*(none — no existing specs have requirement changes)*

## Impact

- **New routes:** `src/routes/import/index.tsx`
- **New components:** `ServingSizeAdjuster`, `ExportButton`, `ImportPage`, `ImportPreviewModal`
- **New server functions / API:** import create action, export query (server-side JSON serialisation)
- **Styling:** global print stylesheet added to root layout or Tailwind config
- **Nav:** Import link added to recipe management nav
