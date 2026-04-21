# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-04-20

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** cookbook-tanstack
- **Description:** A TanStack Start migration of the Laravel recipe application. This is a full-stack recipe management system built with TanStack Start, React, and Tailwind CSS.
- **CI:** `wait-for-ai-reviews.yml` must treat Copilot/Gemini completion as either a successful matching check-run or a submitted PR review on the current head SHA; check-run names alone are not reliable in this repo.

- **AdSense:** Public-page AdSense rendering is production-only; in local/test environments, public home/landing tests should assert the ad slots are absent rather than placeholder-visible.

## Do-Not-Repeat

[2026-04-20] After refactoring AdSense slot config, update source-contract assertions to match the rendered contract (for example `data-ad-slot={...}`) instead of internal variable names.


<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
