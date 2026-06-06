## Context

- **Relevant architecture**: tRPC router (`src/server/trpc/routers`), Mongoose database models (Cookbook, Recipe, Collaborator, User), TanStack Router file-based pages, React frontend components (`RecipeDetail`, `PrintLayout`).
- **Dependencies**: Mongoose ODM, tRPC v10, Better-Auth (for user sessions and collection `user`), `@tanstack/react-query` for API caching.
- **Interfaces/contracts touched**: `trpc.cookbooks.printById` input and output schemas.

## Goals / Non-Goals

### Goals

- Return the owner name and collaborators list (names and roles) in the `printById` query, restricted by authorization check.
- Return the creator name (`addedByName`) for each recipe in the `printById` query.
- Render the owner and collaborator list in a footer at the bottom of the Table of Contents print view.
- Render the recipe creator name in the print-only metadata line on each recipe page in collaborative cookbooks.

### Non-Goals

- Displaying this collaborator data on the screen-view pages (out of scope).
- Allowing editing of collaborators in the print view.

## Decisions

### Decision 1: Restrict collaborator print metadata in tRPC query

- **Chosen**: Only retrieve collaborator documents and names if `ctx.user` is authenticated and matches the owner of the cookbook or is an active collaborator on that cookbook. Otherwise, return an empty array.
- **Alternatives considered**: Always retrieve collaborators since the print view requires authorization. Rejected because public cookbooks can be printed by anonymous visitors, which would leak private collaborator names.
- **Rationale**: Fully guarantees user privacy by returning an empty array for anonymous or unauthorized users.
- **Trade-offs**: Authenticated collaborators see the full footer, but anonymous viewers of a public cookbook only see "Created by: [Owner]" without collaborator names.

### Decision 2: Batch fetch recipe creator usernames

- **Chosen**: Extract unique `userId` values from all recipe documents in the cookbook, query the `user` collection via MongoDB Driver (`getMongoClient().db().collection("user").find(...)`), map them to a lookup Map, and assign `addedByName` in the recipe output mapping of `printById`.
- **Alternatives considered**: Execute a populate stage on `Recipe.find` for the `userId` field. Rejected because the `User` model is managed by Better-Auth and not registered as a standard Mongoose model, so aggregation lookup or direct collection lookup is preferred.
- **Rationale**: High performance, single database query instead of per-recipe lookups.
- **Trade-offs**: Requires a small raw MongoDB driver collection query block in the tRPC router, which is already a pattern in `users.ts`.

### Decision 3: Placement of collaborator names in print UI

- **Chosen**: Add a print-only section at the bottom of the Table of Contents page (`src/routes/cookbooks.$cookbookId_.print.tsx`), rendering the owner and collaborator names.
- **Alternatives considered**: Display as a footer on every single page. Rejected because repeating a long list of collaborators on every printed recipe page is visually cluttered and reduces the printable space.
- **Rationale**: Keeps recipe details clean and professional, and mimics a book's "Credits" page.
- **Trade-offs**: The footer is only visible on Page 1.

## Proposal to Design Mapping

- **Proposal element**: Table of Contents footer showing Created by and Collaborators list.
  - **Design decision**: Decision 1 & Decision 3.
  - **Validation approach**: Check print output in browser and verify using integration tests.
- **Proposal element**: Recipe author attribution ("Added by [Author]").
  - **Design decision**: Decision 2.
  - **Validation approach**: Check that `printMetaLine` renders creator name on recipe pages for collaborative cookbooks.
- **Proposal element**: Privacy restriction for collaborator data on public views.
  - **Design decision**: Decision 1.
  - **Validation approach**: Integration tests verify anonymous user gets empty collaborator array.

## Functional Requirements Mapping

- **Requirement**: Owner name and collaborator display names are displayed on Table of Contents print page footer.
  - **Design element**: `src/routes/cookbooks.$cookbookId_.print.tsx` footer component.
  - **Acceptance criteria reference**: Specs to be defined.
  - **Testability notes**: Verify that DOM elements containing owner name and collaborator names render on TOC page.
- **Requirement**: Recipe author name is displayed on each printed recipe page under metadata if cookbook is collaborative.
  - **Design element**: `src/components/recipes/RecipeDetail.tsx` metadata line.
  - **Acceptance criteria reference**: Specs to be defined.
  - **Testability notes**: Verify `Added by` text is present in the print metadata paragraph.

## Non-Functional Requirements Mapping

- **Requirement category**: security
  - **Requirement**: Do not expose collaborator emails or details to unauthorized users.
  - **Design element**: Decision 1 auth gating in tRPC query.
  - **Acceptance criteria reference**: Specs to be defined.
  - **Testability notes**: Mock anonymous call to `printById` and assert `collaborators` is empty.
- **Requirement category**: performance
  - **Requirement**: Query executes efficiently without N+1 database queries.
  - **Design element**: Decision 2 batch user lookup.
  - **Acceptance criteria reference**: Specs to be defined.
  - **Testability notes**: Verify that only a single batch lookup is made to `user` collection.

## Risks / Trade-offs

- **Risk/trade-off**: Collaborator display names could be missing or blank.
  - **Impact**: Low.
  - **Mitigation**: Fallback to a default name or empty string if name is missing in database.

## Rollback / Mitigation

- **Rollback trigger**: Production print views failing, layout breaking, or security scans flagging user collection queries.
- **Rollback steps**: Revert the git commit for the changes in `cookbooks.ts` router and print files.
- **Data migration considerations**: None, no database schema migration is required.
- **Verification after rollback**: Verify that standard print page continues to function.

## Operational Blocking Policy

- **If CI checks fail**: The PR cannot be merged. Fix the lint/TypeScript/test errors before merge.
- **If security checks fail**: Remediate immediately. Do not merge until security tool outputs clean pass.
- **If required reviews are blocked/stale**: Coordinate with code author/maintainer to resolve reviews.
- **Escalation path and timeout**: Escalate to Doug Hubbard if blocked for more than 48 hours.

## Open Questions

- There are no open questions.
