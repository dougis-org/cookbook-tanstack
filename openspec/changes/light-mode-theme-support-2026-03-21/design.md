# Design: Light Mode Theme Support

## Approach

Pure Tailwind class conversion — no new components, no CSS variables, no JS changes. Every hardcoded dark-palette class gains a light-mode default and its existing value becomes the `dark:` variant.

The `.dark` class on `<html>` continues to be the sole toggle mechanism (class-based `@custom-variant dark`). `prefers-color-scheme` is not used.

---

## Color Token Map

The following table defines the canonical light↔dark pairings used consistently across all affected components.

| Role | Light mode | Dark mode (current) |
|------|-----------|---------------------|
| Page background | `from-gray-50 via-white to-gray-50` (gradient) | `from-slate-900 via-slate-800 to-slate-900` |
| Header bar | `bg-slate-100` | `bg-gray-800` |
| Sidebar | `bg-white` | `bg-gray-900` |
| Card / panel surface | `bg-white` | `bg-slate-800` |
| Elevated surface | `bg-gray-50` | `bg-slate-700` |
| Input background | `bg-white` | `bg-slate-700` / `bg-gray-700` |
| Input border | `border-gray-300` | `border-slate-600` |
| Primary text | `text-gray-900` | `text-white` |
| Secondary text | `text-gray-600` | `text-gray-300` |
| Muted text | `text-gray-400` | `text-gray-400` (unchanged) |
| Dividers / borders | `border-gray-200` | `border-gray-700` / `border-slate-700` |
| Hover surface | `hover:bg-gray-100` | `hover:bg-gray-700` / `hover:bg-slate-700` |

---

## Badge Color Design (Option A — Saturated Tones)

Badge components use color families that map directly to their taxonomy type. Light mode uses solid `*-100` backgrounds with `*-700` text for strong legibility on white backgrounds.

| Badge type | Light bg | Light text | Light border | Dark bg | Dark text | Dark border |
|-----------|----------|-----------|-------------|---------|----------|-------------|
| meal | `bg-amber-100` | `text-amber-700` | `border-amber-300` | `bg-amber-500/20` | `text-amber-300` | `border-amber-500/30` |
| course | `bg-violet-100` | `text-violet-700` | `border-violet-300` | `bg-violet-500/20` | `text-violet-300` | `border-violet-500/30` |
| preparation | `bg-emerald-100` | `text-emerald-700` | `border-emerald-300` | `bg-emerald-500/20` | `text-emerald-300` | `border-emerald-500/30` |
| classification | `bg-cyan-100` | `text-cyan-700` | `border-cyan-300` | `bg-cyan-500/20` | `text-cyan-300` | `border-cyan-500/30` |

---

## Component-by-Component Notes

### Header.tsx
- Outer nav: `bg-slate-100 dark:bg-gray-800`, `text-gray-900 dark:text-white`
- Nav link hover: `hover:bg-gray-200 dark:hover:bg-gray-700`
- Search input: `bg-white dark:bg-gray-700`, `text-gray-900 dark:text-white`, `placeholder-gray-400`
- Search icon: `text-gray-400 dark:text-gray-400` (unchanged)
- Sidebar: `bg-white dark:bg-gray-900`
- Sidebar divider: `border-gray-200 dark:border-gray-700`
- Sidebar link hover: `hover:bg-gray-100 dark:hover:bg-gray-800`
- Auth link text: `text-gray-600 dark:text-gray-300`

### PageLayout.tsx
- Outer container: `bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900`
- Page title: `text-gray-900 dark:text-white`
- Page description: `text-gray-500 dark:text-gray-400`

### FormInput.tsx
- Label: `text-gray-700 dark:text-gray-300`
- Input: `bg-white dark:bg-slate-700`, `border-gray-300 dark:border-slate-600`, `text-gray-900 dark:text-white`

### MultiSelectDropdown.tsx
- Trigger button: `bg-white dark:bg-slate-800`, `border-gray-300 dark:border-slate-700`, `text-gray-700 dark:text-gray-400`
- Dropdown panel: `bg-white dark:bg-slate-800`, `border-gray-200 dark:border-slate-700`
- Option hover: `hover:bg-gray-100 dark:hover:bg-slate-700`
- Option text: `text-gray-900 dark:text-gray-300` / `text-cyan-600 dark:text-cyan-300` (selected)
- Count text: `text-gray-400 dark:text-gray-500`

### AuthPageLayout.tsx
- Card: `bg-white dark:bg-slate-800`, `border-gray-200 dark:border-slate-700`
- Title: `text-gray-900 dark:text-white`

### Auth form components
- Body text: `text-gray-600 dark:text-gray-300` / `text-gray-500 dark:text-gray-400`
- Checkbox: `border-gray-300 dark:border-slate-600`, `bg-white dark:bg-slate-700`

### ProfileInfo.tsx
- Avatar placeholder: `bg-gray-200 dark:bg-slate-700`
- Avatar border: unchanged (`border-cyan-500`)
- Avatar icon: `text-gray-500 dark:text-gray-400`
- Name: `text-gray-900 dark:text-white`
- Member since: `text-gray-500 dark:text-gray-400`
- Info rows: `text-gray-700 dark:text-gray-300`

### routes/index.tsx (Home page)
- Hero heading: `text-gray-900 dark:text-white`
- Hero subtext: `text-gray-600 dark:text-gray-300`
- Hero body text: `text-gray-500 dark:text-gray-400`
- Secondary CTA button: `bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600`
- Section heading: `text-gray-900 dark:text-white`
- Feature cards: `bg-white dark:bg-slate-800/50`, `border-gray-200 dark:border-slate-700`
- Feature card heading: `text-gray-900 dark:text-white`
- Feature card body: `text-gray-500 dark:text-gray-400`

### routes/recipes/index.tsx (Recipe listing)
- Search input: `bg-white dark:bg-slate-800`, `border-gray-300 dark:border-slate-700`, `text-gray-900 dark:text-white`
- Filter dropdowns (native `<select>`): same as search input
- Pagination buttons: `bg-white dark:bg-slate-800`, `border-gray-300 dark:border-slate-700`, `text-gray-900 dark:text-white`
- Pagination text: `text-gray-500 dark:text-gray-300`
- Filter tag pill: `bg-gray-200 dark:bg-slate-700`, `text-gray-700 dark:text-gray-300`
- Empty/loading text: `text-gray-500 dark:text-gray-400`
- Results count: `text-gray-500 dark:text-gray-400`
