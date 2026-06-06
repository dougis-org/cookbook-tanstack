## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Cookbook Print Credits Footer

The system SHALL display the cookbook creator and collaborator list on the printed Table of Contents.

#### Scenario: Render owner and collaborator names for authorized users

- **Given** an authenticated user who is the owner or an active collaborator of a collaborative cookbook.
- **When** the cookbook print page loads.
- **Then** the Table of Contents print footer displays "Created by: [Owner Name]" and "Collaborators: [Collab 1], [Collab 2]".

#### Scenario: Hide collaborator list for anonymous public viewers

- **Given** an unauthenticated anonymous visitor viewing a public collaborative cookbook's print page.
- **When** the cookbook print page loads.
- **Then** the Table of Contents print footer displays "Created by: [Owner Name]" but the collaborators list is completely hidden.

---

## MODIFIED Requirements

### Requirement: MODIFIED Recipe Print Metadata Line

The system SHALL display the name of the collaborator who added the recipe in collaborative cookbooks.

#### Scenario: Show author name on recipe page in collaborative cookbook

- **Given** a collaborative cookbook (has collaborators) containing a recipe created by collaborator "Alice".
- **When** the print page loads.
- **Then** the recipe's printed metadata line includes "Added by: Alice".

#### Scenario: Hide author name on recipe page in single-user cookbook

- **Given** a cookbook with no collaborators (single-user).
- **When** the print page loads.
- **Then** the recipe's printed metadata line does not show any "Added by" section.

---

## REMOVED Requirements

### Requirement: REMOVED None

Reason for removal: N/A

---

## Traceability

- **Proposal element** (TOC footer showing owner & collaborators) -> **Requirement**: ADDED Cookbook Print Credits Footer
- **Proposal element** (Recipe author attribution) -> **Requirement**: MODIFIED Recipe Print Metadata Line
- **Design decision** (Decision 1: Restrict collaborator data) -> **Requirement**: ADDED Cookbook Print Credits Footer (Scenario: Hide collaborator list for anonymous public viewers)
- **Design decision** (Decision 2: Batch fetch recipe creators) -> **Requirement**: MODIFIED Recipe Print Metadata Line (Scenario: Show author name on recipe page in collaborative cookbook)
- **Requirement**: ADDED Cookbook Print Credits Footer -> **Task**: UI Table of Contents Credits Footer and Backend tRPC Update
- **Requirement**: MODIFIED Recipe Print Metadata Line -> **Task**: UI Recipe Attribution and Backend tRPC batch query

---

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** a cookbook containing 50 recipes with multiple authors.
- **When** `trpc.cookbooks.printById` is queried.
- **Then** the database batch lookup for user names resolves in a single query and the complete API response resolves in under 150ms.

### Requirement: Security

#### Scenario: Access control

- **Given** an unauthenticated visitor or unauthorized user.
- **When** executing `trpc.cookbooks.printById` for a private cookbook.
- **Then** the API returns a null response (which the UI handles as a NOT_FOUND state).
