## 1. Shared Accordion component

- [x] 1.1 Write failing unit tests for `src/components/ui/Accordion.tsx`: renders items from `items` prop, each section toggles independently, `defaultOpenId` opens the matching item on initial render and collapses the rest, keyboard Enter/Space toggles via native `<details>` behavior
- [x] 1.2 Implement `Accordion` component to pass the tests: `<details>/<summary>` based, theme-token styled (border, radius, `transition-transform` on Lucide `ChevronDown`), no hardcoded colors
- [x] 1.3 Verify the component renders legibly by eye in all four themes (`dark`, `dark-greens`, `light-cool`, `light-warm`) via the running dev server

## 2. Privacy policy content and route

- [x] 2.1 Write failing tests for `/privacy-policy` route: renders without authentication, renders all five expected section headings (Your Account, Your Recipes & Cookbooks, Billing, Third-Party Sharing, Changes to This Policy), Third-Party Sharing section text mentions the `read:own-content` scope and states password/email/payment data are not shared, and states linked accounts are user-revocable
- [x] 2.2 Draft the actual policy copy for all five sections per design.md's content structure, using `privacy@mycookbooks.com` as the contact address and a static `Last updated: <date>` line
- [x] 2.3 Implement `src/routes/privacy-policy.tsx`, composing the five sections via the `Accordion` component, to pass the tests written in 2.1
- [x] 2.4 **Human review checkpoint**: have the site owner (user) review and approve the actual policy copy for legal accuracy/completeness before this task is checked off — this change does not carry legal sign-off on its own

## 3. Wire up the existing dangling link

- [x] 3.1 Update `src/components/auth/RegisterForm.tsx`: replace the `/privacy-policy` `<a>` with TanStack Router `<Link to="/privacy-policy">`; update the TODO comment to reflect that only the privacy-policy half is resolved (the `/terms` half remains pending #625)
- [x] 3.2 Add/update a test on `RegisterForm` asserting the Privacy Policy link renders as a router `<Link>` (client-side navigation) rather than a raw anchor

## 4. Verification

- [x] 4.1 Run the full unit/integration test suite (`npm run test`) and confirm all new and existing tests pass
- [x] 4.2 Manually click through: registration screen → Privacy Policy link → page loads → each section expands/collapses independently → no console errors
- [x] 4.3 Confirm no regressions to existing registration flow tests
