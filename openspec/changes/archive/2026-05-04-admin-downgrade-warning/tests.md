---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `admin-downgrade-warning` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Test: confirmation modal shows warning when downgrading tier (home-cook → prep-cook is NOT downgrade, prep-cook → home-cook IS downgrade)
- [ ] Test: confirmation modal does not show warning when upgrading tier (prep-cook → sous-chef)
- [ ] Test: warning visible when selecting a tier with lower TIER_RANK than current
- [ ] Test: warning absent when selecting a tier with higher TIER_RANK than current
- [ ] Test: Cancel button still dismisses modal when warning is visible
- [ ] Test: Confirm button still calls setTier mutation when warning is visible

## Test Case Details

### Test: confirmation modal shows warning when downgrading tier

**Task reference:** Task 1 in tasks.md (Add downgrade warning to confirmation modal)
**Spec reference:** "Admin Tier Downgrade Warning" — Scenario: Downgrade confirmation shows warning

**Setup:**
- Mock `useAuth` to return admin session (id: 'admin-000')
- Mock `useQuery` to return users with Alice on prep-cook tier
- Mock `useMutation` to return { mutate, isPending }

**Steps:**
1. Render `<AdminUsersPage />`
2. Find Alice's tier select: `screen.getByLabelText('Change tier for alice@test.com')`
3. Change to home-cook (lower rank): `fireEvent.change(aliceSelect, { target: { value: 'home-cook' } })`
4. Assert dialog appears: `expect(screen.getByRole('dialog')).toBeInTheDocument()`
5. Assert warning element exists: `expect(screen.getByRole('dialog').querySelector('.bg-amber-500\\/10')).toBeInTheDocument()`

**Expected behavior:** Warning block (amber-tinted) renders in the dialog.

---

### Test: confirmation modal does not show warning when upgrading tier

**Task reference:** Task 1 in tasks.md (Add downgrade warning to confirmation modal)
**Spec reference:** "Admin Tier Downgrade Warning" — Scenario: Upgrade confirmation does not show warning

**Setup:**
- Same as above, Alice on prep-cook tier

**Steps:**
1. Render `<AdminUsersPage />`
2. Find Alice's tier select
3. Change to sous-chef (higher rank): `fireEvent.change(aliceSelect, { target: { value: 'sous-chef' } })`
4. Assert dialog appears
5. Assert warning element is null: `expect(screen.getByRole('dialog').querySelector('.bg-amber-500\\/10')).not.toBeInTheDocument()`

**Expected behavior:** No warning block in the dialog.

---

### Test: Cancel button still dismisses modal when warning is visible

**Task reference:** Task 1 in tasks.md (confirmation buttons remain functional)
**Spec reference:** "Confirmation Buttons Remain Functional" — Scenario: Cancel dismisses modal without mutation

**Setup:**
- Same as downgrade setup

**Steps:**
1. Render, open downgrade modal
2. Click Cancel: `fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))`
3. Assert modal gone: `expect(screen.queryByRole('dialog')).not.toBeInTheDocument()`
4. Assert mutate not called: `expect(mockMutate).not.toHaveBeenCalled()`

**Expected behavior:** Existing behavior preserved.

---

### Test: Confirm button still calls setTier mutation when warning is visible

**Task reference:** Task 1 in tasks.md (confirmation buttons remain functional)
**Spec reference:** "Confirmation Buttons Remain Functional" — Scenario: Confirm calls setTier with correct arguments

**Steps:**
1. Render, open downgrade modal
2. Click Confirm: `fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))`
3. Assert mutate called with correct args: `expect(mockMutate).toHaveBeenCalledWith({ userId: USER_A_ID, tier: 'home-cook' })`

**Expected behavior:** Existing behavior preserved — warning is additive.