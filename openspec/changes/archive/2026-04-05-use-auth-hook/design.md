## Context

The frontend currently calls `useSession()` from Better Auth directly at 6 call sites, each deriving `isLoggedIn = !!session?.user` locally. There is no canonical hook that documents what auth state the frontend agrees on. This design introduces a thin `useAuth` wrapper hook and migrates all call sites.

**Proposal → Design mapping:**
| Proposal element | Design decision |
|---|---|
| New `useAuth` hook | `src/hooks/useAuth.ts` — consistent with existing hook pattern |
| Mock at hook level (Option B) | All test mocks target `@/hooks/useAuth`, not `@/lib/auth-client` |
| `isOwner` stays local | No change — components compute `userId === thing.userId` themselves |
| `useSession` stays exported | Not removed — hook calls it internally; nothing else imports it after migration |

## Goals / Non-Goals

**Goals:**
- Single derivation point for `isLoggedIn` and `userId`
- All component tests express auth state via `useAuth` mock (cleaner intent)
- `useAuth` has its own unit tests in `src/hooks/__tests__/useAuth.test.ts`

**Non-Goals:**
- No behavior changes in any component
- No changes to `src/lib/auth-client.ts` exports
- No changes to server-side auth (`src/server/trpc/context.ts`)
- No new auth capabilities

## Decisions

### 1. Hook location: `src/hooks/useAuth.ts`

**Why:** `src/hooks/` already contains `useAutoSave`, `useRecipeSearch`, `useScrollSentinel` — all thin wrappers that derive UI state from lower-level primitives. `useAuth` fits this pattern exactly. Co-locating with `auth-client.ts` would mix infrastructure exports with derived UI state.

**Alternative considered:** `src/lib/auth-client.ts` — rejected because `lib/` is infrastructure, not derived UI state.

### 2. Mock strategy: Option B (mock `useAuth`, not `useSession`)

**Why:** Tests express intent ("I need a logged-in user") rather than implementation ("session has this shape"). If Better Auth's session shape changes, only the hook and its own tests change — no component test updates needed.

**Alternative considered:** Option A (continue mocking `useSession`) — simpler migration, but tests remain coupled to Better Auth's internal shape.

### 3. Hook signature

```typescript
export function useAuth() {
  const { data: session, isPending } = useSession()
  return {
    session,
    isPending,
    isLoggedIn: !!session?.user,
    userId: session?.user?.id ?? null,
  }
}
```

`userId` typed as `string | null` — null when logged out. Components that need `isOwner` compute it locally: `const isOwner = userId === thing.userId`.

### 4. `useSession` remains exported from `auth-client.ts`

Not removed — it is still the implementation detail inside `useAuth`. After migration, no production component should import it directly, but removing it would be a separate cleanup PR. Leaving it in place keeps this diff small and focused.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Missed mock site → test fails with import error | Easy to detect — CI will catch any `useSession` mock that wasn't updated |
| Future dev imports `useSession` directly | Convention only — no lint rule enforces `useAuth`. Could add an ESLint rule later. |
| `userId` type widens unexpectedly | Hook returns `string \| null`; TypeScript enforces null check at call sites |

## Rollback / Mitigation

This is a pure refactor — no behavior changes. Rollback is reverting the PR. No migration scripts, no data changes, no feature flags needed.

## Open Questions

None. All decisions made during explore mode (see proposal.md).
