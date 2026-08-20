## ADDED Requirements

### Requirement: Header user link navigates to the consolidated account page

The system SHALL point the Header's authenticated user link (the element
showing the user's name/email, previously targeting `/auth/profile`) at
`/account`. This is the same single link element that renders across all
viewport widths (icon-only below the `sm` breakpoint, icon + name/email at
`sm:` and above) — no separate mobile-drawer entry needs to change since
none currently exists for this link.

#### Scenario: Clicking the Header user link opens the consolidated account page

- **Given** a logged-in user viewing any page with the Header visible
- **When** they click their name/email in the Header
- **Then** they navigate to `/account`, not `/auth/profile`

#### Scenario: Link behavior is consistent at narrow viewport widths

- **Given** a logged-in user on a mobile-width viewport where the Header
  shows the user icon without visible name/email text
- **When** they tap the icon
- **Then** they navigate to `/account`, identical to the desktop-width
  behavior

## Traceability

- Proposal "Repoint the existing Header user link ... to the consolidated
  account page" → Requirement: Header user link navigates to the
  consolidated account page
- Proposal assumption (single link element covers desktop + mobile widths,
  no separate drawer entry) → Requirement: Link behavior is consistent at
  narrow viewport widths
- Requirements → Tasks: `Header.tsx` link-target update task
