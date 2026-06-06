## GitHub Issues

- dougis-org/cookbook-tanstack#461

## Why

- **Problem statement**: Collaborative cookbooks display owner and collaborator lists in the web UI, but when printed or exported as a PDF, this collaborator context is completely lost. Additionally, individual recipe contribution/attributions (who added which recipe) are not printed.
- **Why now**: Print view is key for physical cookbook sharing. As collaborative cookbooks are a major feature, losing contribution attribution in print degrades the collaborative experience.
- **Business/user impact**: Increases the sense of collaborative ownership and personal connection to the printed recipes, while clarifying who contributed each recipe.

## Problem Space

- **Current behavior**: Print page (`/cookbooks/:cookbookId/print`) retrieves and shows name, description, and recipes grouped by chapter. No collaborator footer or recipe author attribution is displayed.
- **Desired behavior**: 
  - The Table of Contents page (Page 1) displays a footer with the cookbook's owner (Created by) and collaborators (Shared with) list.
  - Each printed recipe page displays an optional "Added by: [Author]" indicator in the print metadata line if the cookbook is collaborative (has collaborators).
- **Constraints**:
  - Must not leak private collaborator names or emails to unauthorized anonymous public users.
  - Must keep individual recipe layout clean and printable on a single page when possible.
- **Assumptions**:
  - Users prefer contributor lists on the Table of Contents page rather than repeated at the bottom of every printed recipe page.
  - Users want recipe attribution (e.g. "Added by Alice") to appear only in collaborative cookbooks, not single-user cookbooks.
- **Edge cases considered**:
  - Cookbook is public (`isPublic: true`) and viewed anonymously: collaborator list is hidden; recipe author is shown as it is standard public content.
  - Recipe creator is the same as the cookbook creator: show "Added by [Owner]" for clarity.

## Scope

### In Scope

- Updating tRPC query `cookbooks.printById` to retrieve the cookbook owner name, collaborator list (only if authenticated and authorized), and recipe creator names.
- Adding a collaborator list section to the Table of Contents print view.
- Adding recipe creator names to the print metadata in `RecipeDetail.tsx` when the cookbook has collaborators.
- Standard test suites to verify tRPC output and UI rendering.

### Out of Scope

- Modifying screen view for standard recipe list or detail page.
- Dynamic print options/settings overlay on the print page (using default print media behavior).

## What Changes

- **Backend**: `src/server/trpc/routers/cookbooks.ts` (`printById` query) to load and return owner name, recipe creators, and collaborators.
- **Frontend**: 
  - `src/routes/cookbooks.$cookbookId_.print.tsx` to render the credits footer on the Table of Contents.
  - `src/components/recipes/RecipeDetail.tsx` to render `Added by: [User]` in `printMetaLine` when appropriate.

## Risks

- **Risk**: Exposing private collaborator names/emails to unauthorized users.
  - **Impact**: High.
  - **Mitigation**: Restrict fetching and displaying the collaborator list in the `printById` API to authenticated owners and collaborators only.

## Open Questions

- There is no unresolved ambiguity. The explore phase successfully aligned on the design decisions.

## Non-Goals

- Allowing editors or viewers to invite/remove collaborators from the print view (interactive controls are completely hidden on print).
- Showing user avatars in the print view (uses clean text names for monochrome printing support).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
