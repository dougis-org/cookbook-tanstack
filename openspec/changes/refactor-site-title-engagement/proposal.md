## GitHub Issues

- #446

## Why

- **Problem statement:** The current site title "CookBook" feels generic and lacks personalization, which can lead to lower user engagement.
- **Why now:** As the application matures, establishing a strong, personal brand identity ("My CookBooks") is critical for user retention and emotional connection.
- **Business/user impact:** Increased user engagement, better brand recognition, and a more "premium" feel for the personal recipe management experience.

## Problem Space

- **Current behavior:** Hardcoded "CookBook" strings in the header, home page, root layout, and metadata. Standard system font stack.
- **Desired behavior:** All user-facing brand labels updated to "My CookBooks". Typography updated to the brand-specific Fraunces (display) and Inter (body). Assets (favicon/logo) synced with the design system.
- **Constraints:**
  - Must not break the layout on mobile/tablet (title is 50% longer).
  - Must adhere to the existing `design-system/` source of truth.
  - Must be consistent across all themes.
- **Assumptions:**
  - Users will prefer the more personal "My CookBooks" over the generic "CookBook".
  - The performance impact of adding Google Fonts (Fraunces/Inter) is acceptable.
- **Edge cases considered:**
  - Very long usernames (if we ever decide to go with "[Name]'s CookBooks" - keeping it to "My CookBooks" for now as per design system).
  - Extremely narrow viewports where the logo might overlap the search bar.

## Scope

### In Scope

- Updating all "CookBook" text to "My CookBooks" in `src/components/Header.tsx`, `src/routes/index.tsx`, `src/routes/home.tsx`, and `src/routes/__root.tsx`.
- Syncing `public/` assets (favicons, logos) from `design-system/assets/`.
- Implementing the brand typography (Fraunces and Inter) in `src/styles.css`.
- Updating E2E test assertions that check for the "CookBook" string.
- Updating `package.json` description and `README.md` headers.

### Out of Scope

- Changing internal variable names, database collection names, or directory names (e.g., `src/routes/cookbooks/` remains).
- Implementing the "Dynamic Username" title (e.g., "Doug's CookBooks").
- Major layout refactors beyond necessary adjustments for the longer title.

## What Changes

- **UI:** Header logo text, Sidebar header, Home page hero, Browser tab title.
- **Assets:** Overwriting files in `public/` with those from `design-system/assets/`.
- **CSS:** Global styles to include new fonts and apply `--font-display` where appropriate.
- **Metadata:** `package.json`, `README.md`, `__root.tsx` meta tags.

## Risks

- **Layout Overflow:**
  - Impact: "My CookBooks" is longer and may wrap or overlap other elements on narrow screens.
  - Mitigation: Adjust header CSS flex-shrink/gap or collapse the search bar earlier.
- **Font FOUT/LCP:**
  - Impact: New display fonts may cause a "Flash of Unstyled Text" or slow down the Largest Contentful Paint.
  - Mitigation: Use `font-display: swap` and preconnect to Google Fonts.

## Open Questions

- **Specific Logo usage:** Should we use the `logo-lockup.svg` (which has the text embedded) or keep the current approach of `ChefHat` icon + `h1` text?
  - Needed from: User
  - Blocker for apply: no (can be decided during design)
- **Typography implementation:** Should we apply Fraunces to all `h1`, `h2`, `h3` globally, or selectively?
  - Needed from: User
  - Blocker for apply: no

## Non-Goals

- Rebranding the entire UI color palette (staying within the 4 themes defined in the design system).
- Changing the feature set or functionality of the app.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
