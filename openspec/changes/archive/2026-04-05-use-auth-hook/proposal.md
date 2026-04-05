## Why

The frontend calls `useSession()` from Better Auth directly in every component that needs auth state, with the `!!session?.user` boolean derivation duplicated at each call site. A single thin `useAuth` hook centralizes this derivation, giving the whole frontend a canonical API for auth state.

## What Changes

- Add `src/hooks/useAuth.ts` — wraps `useSession` and returns `{ session, isPending, isLoggedIn, userId }`
- Migrate all `useSession` call sites to `useAuth`
- Update all test mocks from `useSession` to `useAuth` (Option B — mock at the hook level)

Affected call sites:
- `src/components/Header.tsx`
- `src/components/auth/ProfileInfo.tsx`
- `src/routes/recipes/index.tsx`
- `src/routes/recipes/$recipeId.tsx`
- `src/routes/cookbooks/index.tsx`
- `src/routes/cookbooks.$cookbookId.tsx`

Affected test files:
- `src/components/auth/__tests__/Header.test.tsx`
- `src/components/auth/__tests__/ProfileInfo.test.tsx`
- `src/routes/recipes/__tests__/$recipeId.test.tsx`
- `src/components/cookbooks/__tests__/CookbooksPage.test.tsx`
- `src/components/cookbooks/__tests__/CookbookDetail.test.tsx`

## Capabilities

### New Capabilities

- `use-auth-hook`: Canonical React hook for frontend auth state — wraps Better Auth's `useSession`, exports `isLoggedIn`, `userId`, `session`, `isPending`

### Modified Capabilities

<!-- No existing spec-level requirements are changing — this is a DX/maintainability refactor. No backend changes. -->

## Impact

- **No behavior changes** — purely a DX/maintainability refactor
- `useSession` remains exported from `src/lib/auth-client.ts` (used by the hook internally; nothing else should import it after migration)
- `isOwner` derivations in `$recipeId.tsx` and `cookbooks.$cookbookId.tsx` remain component-specific (they use `userId` from the hook)
- No backend changes, no API changes, no routing changes

## Problem Space

Each component today does:
```typescript
const { data: session, isPending } = useSession()
const isLoggedIn = !!session?.user
```

If Better Auth changes its session shape, every call site needs updating. The canonical names (`isLoggedIn`, `userId`) are implicit — there's no single place that documents what the frontend agrees on.

## Scope

**In scope:**
- New `useAuth` hook in `src/hooks/useAuth.ts`
- Migration of all 6 production call sites
- Migration of all 5 test mock sites to mock `useAuth` instead of `useSession`
- Unit tests for `useAuth` itself

**Out of scope:**
- Any changes to Better Auth configuration or server-side auth
- `isOwner` logic (stays component-specific)
- Theme toggle or auth UI changes
- Server-side session handling in `src/server/trpc/context.ts`

## Risks

- Low risk — no behavior changes, purely mechanical refactor
- Test mock changes are the main surface: if any mocks are missed, tests will fail with "useSession is not a function" style errors — easy to detect

## Open Questions

No unresolved ambiguity. Decisions confirmed during explore mode:
- Hook location: `src/hooks/useAuth.ts` (matches existing hook pattern)
- Mock strategy: Option B (mock `useAuth` directly in tests, not `useSession`)
- `isOwner` stays local (acknowledged in GitHub issue #200)

## Non-Goals

- Not a performance optimization (Better Auth's `useSession` is already a reactive singleton)
- Not a full auth overhaul — this is a thin wrapper
- Not adding any new auth capabilities beyond the hook itself

---

*If scope changes after approval, proposal.md, design.md, specs, and tasks.md must be updated before apply proceeds.*
