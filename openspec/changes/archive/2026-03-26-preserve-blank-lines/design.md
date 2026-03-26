# Design — preserve-blank-lines

## Context

The affected code lives entirely in `src/components/recipes/RecipeDetail.tsx`. The component renders recipe ingredients as a `<ul>` and instructions as a `<ol>`, both driven by `splitLines()` which currently returns only non-empty lines.

The stack is TanStack Start + React 19, TypeScript strict mode, Tailwind CSS 4. No state management or API layer is involved — this is a pure rendering change.

## Goals / Non-Goals

**Goals:**
- Blank lines in stored text render as visual spacers between content groups
- `splitLines()` is the single place that encodes blank-line semantics — no scattered `line.trim()` checks across render code
- Serving size scaling is unaffected

**Non-Goals:**
- Visual differentiation for section header lines (e.g. lines ending with `:`) — deferred, can revisit
- Persisting or structuring grouped data in the database — blank lines remain a plain-text convention
- Any changes outside `RecipeDetail.tsx`

## Decisions

### 1. `splitLines()` returns `string[]` with `''` as the blank-line sentinel

**Decision:** Change the filter from `line.trim().length > 0` to logic that:
1. Splits on `'\n'`
2. Trims leading and trailing blank lines from the resulting array
3. Collapses consecutive internal blank lines to a single `''`

The return type stays `string[]`. Callers use `line === ''` to identify spacers.

**Rationale:** Keeping the return type as `string[]` is the minimal change — no type changes ripple to `ServingSizeAdjuster`, `useState`, or `useMemo` call sites. A discriminated union type would add safety but is unnecessary overhead for a two-state sentinel (`'' | content`).

**Alternative considered:** Return `Array<string | null>` to make blanks unambiguous. Rejected — adds type complexity without real benefit since `''` is already unambiguous in this context (no legitimate content line will ever be an empty string after `split('\n')`).

### 2. Ingredients: blank line renders as an unstyled spacer `<li>`

**Decision:** In the ingredients `<ul>`, when `line === ''`, render `<li key={i} className="recipe-ingredient-spacer h-2" />` — a short, invisible spacer row with no bullet marker or text.

**Rationale:** A bare `<li>` without the flex/bullet structure avoids visual noise. The `h-2` class provides a small but visible gap consistent with the section-grouping intent. The `recipe-ingredient-spacer` class is testable.

**Alternative considered:** CSS margin on the preceding `<li>`. Rejected — harder to target in tests and less explicit than a dedicated spacer element.

### 3. Instructions: blank line renders as a spacer `<li>`, step counter is separate from array index

**Decision:** Replace `index + 1` step numbering with a dedicated `stepNumber` counter that only increments for non-blank lines. Blank lines render as `<li key={i} className="recipe-instruction-spacer h-2" />`.

**Rationale:** Using the array index for step numbers would produce gaps (1, 2, 4 if index 2 is blank). A separate counter ensures step numbers are always contiguous while blank-line spacers are excluded from the count.

**Implementation:** Use a mutable ref or accumulate via a `reduce` / `map` pre-pass that assigns step numbers before rendering.

### 4. `ServingSizeAdjuster` receives the full `string[]` including `''` entries

**Decision:** No filtering of blank lines before passing to `ServingSizeAdjuster`.

**Rationale:** `scaleQuantity('')` hits the `if (!match) return quantity` branch and returns `''` — safe. Filtering before the adjuster would require a second pass and could desync the scaled array indices from the display array.

## Data Flow

```
recipe.ingredients / recipe.instructions
           │  (stored as newline-separated text)
           ▼
       splitLines()
       ├── split('\n')
       ├── trim leading/trailing blank lines
       ├── collapse consecutive blanks → single ''
       └── returns string[]  ('' = spacer sentinel)
           │
           ├──► ingredientLines / instructionLines
           │         │
           │         ├──► ServingSizeAdjuster (ingredients prop)
           │         │    └── scaleQuantity('') → ''  ✓
           │         │
           │         └──► render loop
           │              ├── line === ''  → <li className="...-spacer h-2" />
           │              └── line !== ''  → normal <li> with bullet / step number
           │
           └──► (instructions) stepCounter increments only for non-blank lines
```

## Risks / Trade-offs

- **Leading/trailing blank lines trimmed** — a recipe stored with a leading blank line will not render a top spacer. This is intentional: leading/trailing whitespace in a text field is almost certainly a data entry artifact, not intentional grouping.
- **Consecutive blanks collapsed** — multiple blank lines between groups render as a single gap. Consistent with standard text editing conventions; prevents runaway whitespace if data is pasted from external sources.
- **`key={i}` on list items** — existing behaviour, preserved. Keys are stable within a render; blank spacer items shifting indices on re-render is not a concern since these are display-only lists with no per-item state.
