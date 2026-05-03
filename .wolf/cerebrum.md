# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-04-20

## User Preferences

- Use built-in Read/Edit/Write tools for all file inspection and editing — do not use Bash with sed/cat/grep for file reads that could be done with the dedicated tools.

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** cookbook-tanstack
- **Description:** A TanStack Start migration of the Laravel recipe application. This is a full-stack recipe management system built with TanStack Start, React, and Tailwind CSS.
- **CI:** `wait-for-ai-reviews.yml` must treat Copilot/Gemini completion as either a successful matching check-run or a submitted PR review on the current head SHA; check-run names alone are not reliable in this repo.

- **AdSense:** Public-page AdSense rendering is production-only; in local/test environments, public home/landing tests should assert the ad slots are absent rather than placeholder-visible.

## Do-Not-Repeat

[2026-04-20] After refactoring AdSense slot config, update source-contract assertions to match the rendered contract (for example `data-ad-slot={...}`) instead of internal variable names.

[2026-05-02] `src/db/index.ts` calls `mongoose.connect(MONGODB_URI)` at module-load time. Any test file that imports `@/db` will trigger this before `db-connect.ts`'s `beforeAll` can connect to the worker-specific database — causing parallel Vitest workers to land on the wrong (shared) database. The fix is in `db-connect.ts`: if Mongoose is already connected to the wrong database, disconnect and reconnect to `test_worker_<poolId>`. Test helpers must use `mongoose.connection.db` (not `getMongoClient().db()`) to guarantee they're on the worker-isolated database.

[2026-05-02] React 19 (via TanStack Start ≥1.167.46) adds `data-precedence="default"` to `<link rel="stylesheet">` and hoists it to the top of `<head>`, BEFORE inline `<style>` tags. This inverts the CSS cascade: inline `#app-shell { display: none }` wins permanently. Boot-loader `markLoaded()` must explicitly set `s.style.display="block"` and `b.style.display="none"` — cannot rely on cascade. Also: Playwright CSS interception with React 19 suspends Chrome's HTML parser (body is null), so FOUC tests must use post-load assertions, not mid-load DOM checks.

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
