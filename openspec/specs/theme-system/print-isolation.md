# Spec: Print Isolation

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `PrintLayout` uses CSS variable scoped overrides (not DOM manipulation)

The system SHALL render print surfaces using a `<div>` that locally overrides `--theme-*` CSS variables to fixed light values, without manipulating `<html>` class or any global state.

#### Scenario: Print layout renders with light colours regardless of active theme

- **Given** the user has the dark theme active
- **When** a cookbook print page is rendered inside `PrintLayout`
- **Then** the print surface shows a white background and dark text, and the rest of the app remains in dark theme

#### Scenario: Multiple nested `PrintLayout` instances do not conflict

- **Given** two `PrintLayout` components are rendered simultaneously (e.g., a test that mounts two instances)
- **When** both components mount and unmount in any order
- **Then** no global state is modified and no errors are thrown

## MODIFIED Requirements

### Requirement: MODIFIED `PrintLayout` no longer manipulates `<html>` class

The system SHALL NOT add or remove classes from `document.documentElement` during print rendering. The previous `useLayoutEffect`-based approach is removed entirely.

#### Scenario: Active theme class on `<html>` is unchanged by PrintLayout

- **Given** the user is on the dark theme (`<html class="dark">`)
- **When** a route containing `PrintLayout` is rendered
- **Then** `<html>` continues to have class `dark` throughout the lifecycle of that route

#### Scenario: No cleanup effect on `PrintLayout` unmount

- **Given** a `PrintLayout` is mounted and then unmounted
- **When** the component unmounts
- **Then** no `useLayoutEffect` cleanup runs, no class is toggled, and no dataset attributes are set on `document.documentElement`

## REMOVED Requirements

### Requirement: REMOVED `useLayoutEffect` ref-count DOM manipulation in `PrintLayout`

Reason for removal: The `useLayoutEffect` that removed `.dark` from `<html>` and restored it on unmount (with ref-count tracking for nested instances) is replaced entirely by CSS variable scoped overrides on a wrapping `<div>`. The ref-count logic (`printLayoutDarkOverrideCount`, `printLayoutDarkOverrideHadDark` dataset keys) is removed.

## Traceability

- Proposal element "PrintLayout simplified from DOM manipulation hack to scoped CSS variable overrides" → Requirements in this spec
- Design Decision 7 (PrintLayout refactor) → All requirements in this spec
- Requirements → Tasks: Task 8 (PrintLayout refactor)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Print output consistent across all themes

- **Given** any active theme (dark, light, or any future theme)
- **When** a cookbook is printed or the print preview is opened
- **Then** the printed output shows white background (`#ffffff`) and near-black text (`#111827`) regardless of the active theme

### Requirement: Operability

#### Scenario: PrintLayout has no side effects on surrounding components

- **Given** `PrintLayout` is used inside any route
- **When** the component mounts or unmounts
- **Then** no observable changes occur outside the component's own DOM subtree
