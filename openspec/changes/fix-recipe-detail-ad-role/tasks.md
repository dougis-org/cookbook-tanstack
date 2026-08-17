## 1. Verify assumptions

- [ ] 1.1 Re-confirm in `src/components/layout/PageLayout.tsx` that `role` has no consumer other than `isPageAdEligible`/`AdSlot`, so passing `role="public-content"` cannot affect non-ad UI on the recipe detail page.

## 2. Implement the fix

- [ ] 2.1 In `src/routes/recipes/$recipeId.tsx`, add `role="public-content"` to the `<PageLayout>` call in the loading-state return branch.
- [ ] 2.2 In `src/routes/recipes/$recipeId.tsx`, add `role="public-content"` to the `<PageLayout>` call in the not-found return branch.
- [ ] 2.3 In `src/routes/recipes/$recipeId.tsx`, add `role="public-content"` to the `<PageLayout>` call in the success return branch.

## 3. Tests

- [ ] 3.1 Search existing tests for the recipe detail route (e.g. `src/routes/__tests__/` and any `$recipeId` test files) for assertions that currently expect no ad slots for anonymous visitors, and update them to reflect the corrected behavior.
- [ ] 3.2 Add/extend a test asserting that an anonymous (no-session) visitor to `/recipes/$recipeId` sees ad slots render (top, bottom, right-rail), mirroring existing anonymous-ads-eligible coverage for `/recipes`.
- [ ] 3.3 Add/extend a test asserting tier-based suppression still works on the recipe detail page for authenticated users (paid tier sees no ads, `home-cook` tier sees ads, admin sees no ads) — confirming this change did not alter tier-based logic.
- [ ] 3.4 Run the full test suite (`npm run test`) and confirm no regressions elsewhere from the role change.

## 4. Verification

- [ ] 4.1 Manually verify in a local/dev build (or via the deployed preview) that visiting a recipe detail page while logged out renders all three ad/sponsor slots.
- [ ] 4.2 Confirm no other route relies on `$recipeId.tsx`'s previous (incorrect) `authenticated-task` default in a way that would be affected by this change (grep for other imports/usages of the page component, if any exist beyond the route file itself).
