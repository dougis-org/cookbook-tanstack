## GitHub Issues

- dougis-org/cookbook-tanstack#308

## Why

- Problem statement: The app offers Dark and Light (cool) themes but no warm-toned light option. Users who prefer warmer, cream/amber palettes have no suitable theme.
- Why now: The per-file theme architecture and full CSS token contract were established in #302. Adding a warm counterpart is now purely additive — no component changes required.
- Business/user impact: Broader palette choice improves user comfort and satisfaction, particularly for users in warm-lit environments or who find cool-gray interfaces fatiguing.

## Problem Space

- Current behavior: Theme selector offers two options — Dark (slate/cyan) and Light (cool) (slate/blue). No warm light variant exists.
- Desired behavior: A third theme, Light (warm), is available in the theme selector. It uses cream/amber surfaces and amber accents, rendered via the same CSS token contract as the existing themes.
- Constraints: Must implement exclusively via the CSS token layer — no per-component style changes. Token names are fixed by the contract defined in #302.
- Assumptions: All components consume theme tokens correctly (validated by Light (cool) implementation). No gaps in the token contract have been discovered.
- Edge cases considered: Print isolation — PrintLayout overrides `--theme-bg` to white inline, so warm backgrounds do not affect print output.

## Scope

### In Scope

- New `src/styles/themes/light-warm.css` implementing the 15-token contract (14 original + `--theme-overlay` added in #312)
- Registration of `{ id: 'light-warm', label: 'Light (warm)' }` in `ThemeContext.THEMES`
- E2E tests covering theme switching to Light (warm) and visual correctness of key surfaces and accent color

### Out of Scope

- Changes to any React component
- Changes to the CSS token contract itself
- New tokens not already in the contract
- Modifications to Dark or Light (cool) themes
- Print-specific styles (PrintLayout already handles this generically)

## What Changes

- `src/styles/themes/light-warm.css` — new file, 17 lines, defines all 15 CSS custom properties under `html.light-warm`
- `src/contexts/ThemeContext.tsx` — one line added to the `THEMES` array
- `src/e2e/theme.spec.ts` — new test cases for Light (warm) theme switching, persistence, and accent color correctness

## Risks

- Risk: Amber accent (`amber.700`) contrast on white surface may fall below WCAG AA for some text uses
  - Impact: Accessibility regression for users relying on sufficient contrast
  - Mitigation: `amber.700` (#b45309) on white yields ~4.7:1 — comfortably AA for normal text. Verified before implementation.

- Risk: New theme entry in `THEMES` changes the `ThemeId` union type, which is derived via `as const`
  - Impact: TypeScript compile error if any exhaustive switch/type check exists that doesn't account for the new value
  - Mitigation: Search codebase for exhaustive checks on `ThemeId` before wiring up; none are anticipated given the existing pattern.

## Open Questions

No unresolved ambiguity exists. Design decisions were made during explore mode:
- Background: `amber.50` (expressive warm cream, not the more restrained `stone.100`)
- Accent: `amber.700` (preferred for WCAG AA compliance over `amber.600`)
- Implementation: purely additive — confirmed no component gaps discovered in Light (cool)

## Non-Goals

- A "dark warm" variant (sepia/dark amber theme) — out of scope for this issue
- Modifying how the theme selector UI renders (it already scales to N themes)
- Custom per-page or per-component warm overrides

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
