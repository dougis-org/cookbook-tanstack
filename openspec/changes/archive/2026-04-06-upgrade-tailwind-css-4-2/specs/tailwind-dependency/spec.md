# tailwind-dependency Specification

## Purpose
Keeps the Tailwind CSS v4 toolchain current by tracking the latest `tailwindcss` and `@tailwindcss/vite` versions. Both packages must remain at the same version because `@tailwindcss/vite` is tightly coupled to the `tailwindcss` core.

## ADDED Requirements

### Requirement: Tailwind CSS packages at version 4.2.2
Both `tailwindcss` and `@tailwindcss/vite` SHALL be resolved to `4.2.2` in `package-lock.json`. The two packages MUST remain at the same version as `@tailwindcss/vite` is tightly coupled to the `tailwindcss` core.

#### Scenario: Lock file reflects updated versions
- **WHEN** `package-lock.json` is inspected after running `npm install tailwindcss@latest @tailwindcss/vite@latest`
- **THEN** both `tailwindcss` and `@tailwindcss/vite` resolve to `4.2.2`

### Requirement: Existing styling is unaffected
The application's CSS MUST render correctly after the update. The custom dark-mode variant (`@custom-variant dark (&:where(.dark, .dark *))`) in `src/styles.css` SHALL continue to function as before.

#### Scenario: Unit and integration tests pass
- **WHEN** `npm run test` is executed after the package update
- **THEN** all unit and integration tests pass with no new failures

#### Scenario: E2E tests pass
- **WHEN** `npm run test:e2e` is executed after the package update
- **THEN** all Playwright E2E tests pass with no new failures

#### Scenario: Dark mode renders correctly
- **WHEN** the application is loaded with the `.dark` class on `<html>`
- **THEN** dark-mode Tailwind utilities apply correctly to all components

### Requirement: No application code changes required
The update SHALL NOT require changes to any files in `src/`. If a file in `src/` must change to accommodate the Tailwind update, the change MUST be documented and the proposal scope updated before merging.

#### Scenario: Only package files modified
- **WHEN** `git diff --name-only` is inspected after the update
- **THEN** only `package.json` and/or `package-lock.json` appear in the diff (no `src/` files)
