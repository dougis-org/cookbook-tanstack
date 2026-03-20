# Design: Improve Recipe Chiclet Visibility

## Context

Currently, recipe metadata (category, taxonomy, source) uses low-opacity colored badges displayed on white backgrounds. This creates poor contrast and readability issues:
- Background opacity: 20-30% with light text (e.g., `bg-cyan-500/20 text-cyan-300`)
- On white backgrounds, light text on pale colored backgrounds has insufficient contrast
- Visual hierarchy is flat — all badge types appear equally important

The app uses TanStack Start with React, Tailwind CSS, and Lucide React for icons. Both detail and list views need improvements, with category being the primary metadata consumers should focus on.

**Current Components**:
- `TaxonomyBadge.tsx`: Amber (meals), violet (courses), emerald (preparation)
- `ClassificationBadge.tsx`: Cyan, with optional link
- `RecipeDetail.tsx`: Renders all metadata inline
- `RecipeCard.tsx`: Shows category in list view

## Goals / Non-Goals

**Goals:**
1. Improve contrast and readability of recipe metadata on white backgrounds
2. Establish clear visual hierarchy (Category > Taxonomy > Source)
3. Add iconography to improve scannability and meta-understanding
4. Restructure detail view to 2-column layout (category left, source right)
5. Increase category visibility in list cards
6. Ensure responsive behavior on mobile (stacking when necessary)

**Non-Goals:**
- Changing source storage, retrieval, or URL validation logic
- Adding animations or transitions
- Customizable color themes
- Modifications to filter components or cookbook views
- Changing link behavior or navigation patterns

## Decisions

### Decision 1: Opacity + Text Color Strategy for Taxonomy Badges
**Choice**: Increase background opacity from 20% to 60-70% and flip text color to dark variants

**Rationale**:
- 20% opacity creates pale colors on white that require light text, which is invisible
- 60-70% opacity creates visible colored backgrounds that can support dark text (e.g., `text-amber-900`)
- Maintains existing color semantic (amber=meals, violet=courses, emerald=preparation)
- No new dependencies; uses Tailwind built-in opacity modifiers

**Alternatives Considered**:
- Solid colors (100% opacity): Would work but feels too visually heavy in metadata context; 60-70% is a balance
- Reduced opacity with darker text: Doesn't provide enough contrast gain
- Border-only badges (no fill): Less visually scannable, harder to see groupings

**Acceptance Criteria**:
- WCAG AA contrast ratio (4.5:1) for text against badge background
- Visual weight feels secondary to category badge

### Decision 2: Category Badge as Solid, Prominent Element with Icon
**Choice**: Solid background (e.g., `bg-cyan-600`), white text, sized larger (`text-sm` or `text-base`), with icon

**Rationale**:
- Establishes clear visual hierarchy as primary metadata
- Solid background provides maximum contrast and presence
- Icon improves scannability (quick visual identity without reading)
- Icon must be unambiguous (use Lucide `Tag` or `Bookmark` for category)

**Alternatives Considered**:
- Keep existing semi-transparent style but increase opacity: Doesn't signal "primary" strongly enough
- Multiple badges for category: Complicates layout; one category per recipe

**Acceptance Criteria**:
- Category badge is visually dominant in metadata region
- Icon is immediately recognizable as "category" or "classification"
- Works in both detail and list views without overflow

### Decision 3: Detail View 2-Column Layout for Category + Source
**Choice**: Header row with two columns: category badge (left, 40-50% width), source info (right, 50-60% width)

**Rationale**:
- Elevates source to primary visibility level (second most important per user priorities)
- Keeps both at top of recipe, before taxonomy
- Responsive: Stacks on mobile (category above source)
- Clean, scannable layout that mirrors common UI patterns

**Responsive Behavior**:
- Desktop (md+): `flex` with `basis-1/2`, category left, source right
- Mobile (sm, base): Stack vertically (`flex-col`), category first

**Alternatives Considered**:
- Keep source as text below category: Reduces source visibility; user wants it secondary but visible
- Source as small inline text: Harder to read; takes up space without clear visual affordance
- 3-column layout: Cluttered; unnecessary complexity

**Acceptance Criteria**:
- Category and source both clearly visible above taxonomy
- Layout stacks gracefully on < md breakpoint
- Source remains a link when URL present, plain text otherwise

### Decision 4: Iconography Strategy
**Choice**: 
- Category: `Tag` icon (already used in ClassificationBadge)
- Meals: `Utensils` icon
- Courses: `GripVertical` or `BookOpen` icon
- Preparation: `Timer` or `Beaker` icon
- Source: `Link` or `ExternalLink` icon

**Rationale**:
- Lucide React icons are already in use; consistent with codebase
- Icons must be unambiguous enough that users grasp meaning at a glance
- Icons paired with badge text for clarity (no icon-only badges yet)
- Source link icon signals "external/clickable"

**Testing Notes**: 
- Include labels alongside icons initially (e.g., "🍽️ Meals:", "🔗 Source:") to validate user comprehension
- Consider reducing/removing labels in secondary iteration if icons prove clear

**Acceptance Criteria**:
- Users can identify badge types without reading text (future validation)
- Icon contrast is sufficient on badge background (WCAG AA)

### Decision 5: Component Structure
**Choice**: 
- Update `TaxonomyBadge.tsx` to accept increased opacity + dark text as default
- Update `ClassificationBadge.tsx` to support solid styling variant and icon
- Refactor `RecipeDetail.tsx` to use a new `RecipeMetadataHeader` section component for 2-column layout
- Keep `RecipeCard.tsx` badge usage minimal but increase its visual weight

**Rationale**:
- Minimal breaking changes; existing components updated, not replaced
- New layout component keeps RecipeDetail cleaner, testable in isolation
- Card badge styling via Tailwind classes (no new component needed)

**Acceptance Criteria**:
- All existing RecipeDetail rendering paths still work
- Card markdown styling is consistent with detail styling
- Components accept optional `variant` or `solid` props for flexibility

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Icon clarity**: Paired icons might not be universally understood | Start with labels alongside icons; drop labels in later iteration if user testing validates understanding |
| **Mobile layout wrapping**: 2-column header may wrap awkwardly on extra-small screens | Use flexible basis values; test on actual mobile devices; add breakpoint for very small widths if needed |
| **Accessibility**: Color-only badges can isolate colorblind users | Ensure all badges have text + icon; validate contrast ratios; test with accessibility tools |
| **Taxonomy group readability**: Mixing multiple colored badges might feel chaotic | Use consistent spacing; consider grouping by type (all meals together, etc.); leverage icons for uniqueness |
| **Solid category badge in light theme**: May look too heavy | Design aims for dark-first app; white backgrounds are modal/card surfaces, not full-page backgrounds; acceptable trade-off |

## Rollback / Mitigation

- **If CI checks fail**: Revert to `main` and investigate component isolation
- **If contrast tests fail**: Increase opacity further (target 70%+) or adjust text color alternatives
- **If users report icon confusion**: Add labels back to all badges; schedule follow-up iteration
- **If layout breaks on mobile**: Adjust flex breakpoints; test with Playwright E2E

## Open Questions (RESOLVED)

1. **Label persistence**: Should labels (e.g., "Meals:", "Courses:") be present indefinitely, or removed after user validation?
   - **DECISION**: Labels SHALL be present indefinitely for clarity and consistency.

2. **Source styling**: Should source always be styled as a link (color, underline) even without a URL? Currently plain text when no URL.
   - **DECISION**: Keep existing behavior — plain text when no URL, link styling when URL present.

3. **Category linkability**: In detail view, should category badge link to category page, or be plain display?
   - **DECISION**: Plain display (no link) in detail view. Category badge is informational only.

4. **Taxonomy grouping**: Should taxonomy badges be grouped visually (e.g., "Meals: [a] [b]" vs. adjacent unseparated badges)?
   - **DECISION**: Grouped visually with labels ("Meals:", "Courses:", "Preparations:") before each group's badges.

## Proposal-to-Design Mapping

| Proposal Element | Design Decision |
|------------------|-----------------|
| Taxonomy visibility | Decision 1: Opacity increase + dark text |
| Category prominence | Decision 2: Solid background + icon |
| Detail view restructure | Decision 3: 2-column layout for category + source |
| Iconography | Decision 4: Lucide icons with validation strategy |
| Implementation approach | Decision 5: Component updates + new metadata header component |
| Mobile responsiveness | Embedded in Decision 3 responsive behavior |

---

**Blocking Policy**: CI checks (TypeScript, Vitest, E2E) must pass before merge. If color contrast validation tools report failures, address via opacity adjustments before unblocking.
