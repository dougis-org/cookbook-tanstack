# Tasks — F02: Render sponsored content on free-tier authed pages

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b f02-sponsored-content-authed-pages` then immediately `git push -u origin f02-sponsored-content-authed-pages`

---

## Execution

### Task 1: Extend `AD_ENABLED_ROLES` in `src/lib/ad-policy.ts`

**File:** `src/lib/ad-policy.ts`

**Change:** Add `authenticated-home` and `authenticated-task` to the `AD_ENABLED_ROLES` array literal.

```ts
// Before
const AD_ENABLED_ROLES: PageRole[] = ['public-marketing', 'public-content']

// After
const AD_ENABLED_ROLES: PageRole[] = [
  'public-marketing',
  'public-content',
  'authenticated-home',
  'authenticated-task',
]
```

**Verification:** Write a unit test confirming `isPageAdEligible` returns `true` for `authenticated-home` and `authenticated-task` with a home-cook session, and `false` for prep-cook session.

---

### Task 2: Add `right-rail` to `GoogleAdSenseSlotPosition` in `src/lib/google-adsense.ts`

**File:** `src/lib/google-adsense.ts`

**Change:** Extend the position enum and add the slot ID mapping.

```ts
// Before
export type GoogleAdSenseSlotPosition = 'top' | 'bottom'
const GOOGLE_ADSENSE_SLOT_IDS: Record<GoogleAdSenseSlotPosition, string | null> = {
  top: getValidatedGoogleAdSenseSlotId(import.meta.env.VITE_GOOGLE_ADSENSE_TOP_SLOT_ID),
  bottom: getValidatedGoogleAdSenseSlotId(import.meta.env.VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID),
}

// After
export type GoogleAdSenseSlotPosition = 'top' | 'bottom' | 'right-rail'
const GOOGLE_ADSENSE_SLOT_IDS: Record<GoogleAdSenseSlotPosition, string | null> = {
  top: getValidatedGoogleAdSenseSlotId(import.meta.env.VITE_GOOGLE_ADSENSE_TOP_SLOT_ID),
  bottom: getValidatedGoogleAdSenseSlotId(import.meta.env.VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID),
  'right-rail': getValidatedGoogleAdSenseSlotId(import.meta.env.VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID),
}
```

**Verification:** Test `getGoogleAdSenseSlotId('right-rail')` returns `null` when env var is absent and the validated ID when present.

---

### Task 3: Restructure `PageLayout` CSS grid with right rail

**File:** `src/components/layout/PageLayout.tsx`

**Changes:**

1. Replace the single-column `<div class="container mx-auto px-4 py-8">` with a CSS grid:
   ```tsx
   <div className="container mx-auto px-4 py-8">
     <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
       {/* Main content column */}
       <div>
         {title block}
         <AdSlot role={role} position="top" />
         {children}
         <AdSlot role={role} position="bottom" />
       </div>
       {/* Right rail — always in DOM, AdSlot controls visibility */}
       <aside className="hidden lg:block">
         <AdSlot role={role} position="right-rail" />
       </aside>
     </div>
   </div>
   ```

2. Add `sticky top-8` to the right rail aside to make it stick while the user scrolls:
   ```tsx
   <aside className="hidden lg:block sticky top-8">
   ```

3. Wire `VITE_ADSENSE_ENABLED` into the `AdSlot` rendering decision. `AdSlot` signature and useMemo remain the same; the env check happens inside the component to decide between real AdSense and `SponsorSlot`.

**Verification:** Visual test at 1024px+ shows two-column grid with right rail aside. At 768px shows single column.

---

### Task 4: Create `src/components/ads/SponsorSlot.tsx`

**New file:** `src/components/ads/SponsorSlot.tsx`

**Structure:** Create the component following the CSS spec from `design-system/ad-placement-mocks.html`. The component receives `tier` as a prop but returns `null` if `showUserAds(tier)` is false (paid users are gated at `AdSlot` level, but `SponsorSlot` also guards defensively).

**CSS class mapping:**

| Mock class | Purpose |
|---|---|
| `.up-card` | Container with dashed border, `border-radius: 8px`, `::before` for "SPONSORED" eyebrow |
| `.up-media` | 56×56 warm gradient placeholder (`linear-gradient(135deg, #f59e0b, #b45309)`) |
| `.up-body` | Flex column with title "Remove sponsors → Prep Cook" and description |
| `.up-cta` | Right-side CTA section with price "$2.99/mo" and [Upgrade] link to `/pricing` |

**"SPONSORED" eyebrow:** Use the `::before` pseudo-element approach from the mock:
```css
.up-card::before {
  content: "Sponsored";
  position: absolute; top: -8px; left: 16px;
  background: var(--theme-bg);
  color: var(--theme-fg-subtle);
  font-size: 10px; font-weight: 600;
  padding: 0 6px;
  letter-spacing: .12em;
  text-transform: uppercase;
}
```

**Price:** Read from `TIER_PRICING['prep-cook'].monthly` — render as `$2.99/mo` (or current value).

**Verification:** Confirm all four themes render correctly with `--theme-*` tokens. Confirm `.up-*` class family only — no `.ad-*`, `.sponsor-*`, etc.

---

### Task 5: Wire `VITE_ADSENSE_ENABLED` into `AdSlot`

**File:** `src/components/layout/PageLayout.tsx` — inside `AdSlot` component

**Change to `adConfig` useMemo:**

```ts
const adConfig = React.useMemo(() => {
  const slotId = getGoogleAdSenseSlotId(position)
  if (!isPageAdEligible(role, session)) return null

  if (!import.meta.env.PROD) return { slotId, mode: 'sponsor' }
  if (import.meta.env.VITE_ADSENSE_ENABLED !== 'true' || !slotId) {
    return { slotId: null, mode: 'sponsor' }
  }
  return { slotId, mode: 'adsense' }
}, [position, role, session])
```

**Change to render logic:**

```tsx
if (!adConfig) return null

if (adConfig.mode === 'adsense') {
  return (
    <div className="my-8 overflow-hidden ...">
      <ins ref={adRef} className="adsbygoogle block" data-ad-client={...} data-ad-format="auto" data-ad-slot={adConfig.slotId} ... />
    </div>
  )
}

// mode === 'sponsor'
return <SponsorSlot tier={session?.user?.tier ?? 'anonymous'} />
```

**Verification:**
- Dev: `SponsorSlot` renders for eligible user
- PROD, `VITE_ADSENSE_ENABLED` unset: `SponsorSlot` renders
- PROD, `VITE_ADSENSE_ENABLED=true`: real `<ins>` renders

---

### Task 6: Update `src/components/layout/__tests__/PageLayout.test.tsx`

**File:** `src/components/layout/__tests__/PageLayout.test.tsx`

**Tests to add:**

1. **Grid layout at lg+ breakpoint:** Render `PageLayout` and assert the container uses `grid grid-cols-1 lg:grid-cols-[1fr_300px]`
2. **Right rail aside present in DOM:** Assert `<aside>` element exists even when `AdSlot` returns null
3. **Single column below lg breakpoint:** Assert rail is hidden below `lg` (`hidden lg:block`)
4. **`SponsorSlot` renders in dev mode:** Mock `import.meta.env.PROD = false`; assert `SponsorSlot` output is in the DOM
5. **`SponsorSlot` renders when flag is off:** Mock `PROD=true` and `VITE_ADSENSE_ENABLED !== 'true'`; assert `SponsorSlot` output
6. **Real `<ins>` renders when flag is on:** Mock `PROD=true`, `VITE_ADSENSE_ENABLED=true`, valid slot ID; assert `<ins data-ad-slot=...>` element present
7. **`SponsorSlot` hidden for paid users:** Mock session with `prep-cook` tier; assert `AdSlot` returns null (or no sponsor card)
8. **`SponsorSlot` hidden for admin:** Mock session with `isAdmin=true`; assert no ad slot
9. **Adblock-safe classes:** Assert the sponsor card output has `.up-card`, `.up-media`, `.up-body`, `.up-cta` and no blocked patterns (`.ad-*`, `.sponsor-*`, etc.)
10. **Price matches `TIER_PRICING`:** Assert the upgrade CTA text contains the current `prep-cook` monthly price

---

## Validation

- [ ] **Unit tests:** `npm run test -- src/components/layout/__tests__/PageLayout.test.tsx` — all pass
- [ ] **Type checks:** `npx tsc --noEmit` — no errors
- [ ] **Build:** `npm run build` — succeeds
- [ ] **Dev server visual check:** Navigate to `/home`, `/recipes`, `/recipes/:id` with a home-cook session in dev mode — `SponsorSlot` renders with `.up-card`, "SPONSORED" eyebrow, upgrade CTA
- [ ] **AdBlock test (manual):** With uBlock Origin enabled in Chrome, visit `/home` as home-cook — `.up-card` visible and not hidden by cosmetic filter

---

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests must pass
- **Type checks** — `npx tsc --noEmit` — no errors
- **Build** — `npm run build` — succeeds

If **ANY** of the above fail, iterate and address the failure before pushing.

---

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `f02-sponsored-content-authed-pages` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, validate locally, push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, validate locally, push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

**Ownership metadata:**

- Implementer: Claude Code (via #447 `claude-task` label)
- Reviewer(s): Code owner review + auto-merge gate
- Required approvals: 1 (code owner) or auto-merge when checks pass

**Blocking resolution flow:**

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

---

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` — the `SponsorSlot` component and `ad-policy.ts` extension are implementation details that do not require global spec updates (this change adds new behavior to existing capabilities, not new global requirements)
- [ ] Archive the change: move `openspec/changes/render-sponsored-content-on-authed-pages/` to `openspec/changes/archive/2026-05-15-render-sponsored-content-on-authed-pages/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/2026-05-15-render-sponsored-content-on-authed-pages/` exists and `openspec/changes/render-sponsored-content-on-authed-pages/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d f02-sponsored-content-authed-pages`

---

## Summary

| Task | File | Description |
|------|------|-------------|
| 1 | `src/lib/ad-policy.ts` | Add `authenticated-home` and `authenticated-task` to `AD_ENABLED_ROLES` |
| 2 | `src/lib/google-adsense.ts` | Add `right-rail` to position enum; add `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID` |
| 3 | `src/components/layout/PageLayout.tsx` | CSS grid with right rail; sticky `top-8`; env-gated `SponsorSlot` vs real AdSense |
| 4 | `src/components/ads/SponsorSlot.tsx` | New static upgrade card — `.up-*` classes, "SPONSORED" `::before` eyebrow, dynamic pricing |
| 5 | `src/components/layout/PageLayout.tsx` | Wire `VITE_ADSENSE_ENABLED` into `AdSlot` render decision |
| 6 | `src/components/layout/__tests__/PageLayout.test.tsx` | 10 new test cases covering grid layout, env gating, class safety, pricing |